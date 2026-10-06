"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { WindowComponentProps } from "@/lib/windows";
import { Win98Select } from "@/components/ui/Win98Select";
import {
  fetchGuestbookPage,
  fetchGuestbookSnapshot,
  forgetGuestbookMessage,
  mergeGuestbookMessages,
  rememberGuestbookMessage,
} from "@/lib/guestbook/client";
import { useWindowActivity } from "./WindowActivity";
import { onProfileChange, readProfile, writeProfile } from "@/lib/profile";
import {
  BODY_MAX_LENGTH,
  GUESTBOOK_AVATARS,
  GUESTBOOK_CHANNEL,
  GuestbookAvatar,
  GuestbookMessage,
  NICK_MAX_LENGTH,
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
  STATUS_META,
  STATUS_OPTIONS,
  UserStatus,
  nickColor,
} from "@/lib/guestbook/types";
import { AVATAR_LABELS, GuestbookAvatarIcon } from "@/components/ui/GuestbookAvatar";

const NICK_STORAGE_KEY = "floppyy-irc-nick";
const STATUS_STORAGE_KEY = "floppyy-irc-status";
const POLL_INTERVAL_MS = 10000;

let sessionAdminToken = "";

const ICQ_SMILIES = [
  { tokens: [":)", ":-)"], label: "Smile", face: ":)" },
  { tokens: [":D", ":-D"], label: "Laugh", face: ":D" },
  { tokens: [";)", ";-)"], label: "Wink", face: ";)" },
  { tokens: [":(", ":-("], label: "Sad", face: ":(" },
  { tokens: [":P", ":-P"], label: "Tongue", face: ":P" },
  { tokens: [":o", ":O", ":-o", ":-O"], label: "Surprised", face: ":o" },
  { tokens: ["<3"], label: "Love", face: "<3" },
] as const;

const SMILIE_LOOKUP = new Map<string, (typeof ICQ_SMILIES)[number]>(
  ICQ_SMILIES.flatMap((smilie) => smilie.tokens.map((token) => [token, smilie])),
);

const SMILIE_PATTERN = new RegExp(
  `(${[...SMILIE_LOOKUP.keys()]
    .sort((a, b) => b.length - a.length)
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})`,
  "g",
);

function timestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "--/--/-- --:--";
  const day = date.toLocaleDateString([], { month: "2-digit", day: "2-digit", year: "2-digit" });
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day} ${time}`;
}

function renderSmilie(token: string, key: string): ReactNode {
  const smilie = SMILIE_LOOKUP.get(token);
  if (!smilie) return token;
  return (
    <span
      key={key}
      className="mx-[1px] inline-flex h-[14px] min-w-[16px] translate-y-[2px] items-center justify-center border border-[#808080] bg-[#ffff66] px-[2px] text-[9px] font-bold leading-none text-black"
      title={`${smilie.label} ${token}`}
      style={{
        boxShadow: "inset 1px 1px #ffffff, inset -1px -1px #808000",
        fontFamily: "'MS Sans Serif', Arial, sans-serif",
      }}
    >
      {smilie.face}
    </span>
  );
}

function renderMessageBody(body: string): ReactNode[] {
  return renderFormattedText(body);
}

function renderPlainText(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\n| )/).map((part, index) => {
    if (!part) return null;
    if (part === "\n") return <br key={`${keyPrefix}-br-${index}`} />;
    return part.split(SMILIE_PATTERN).map((piece, pieceIndex) => {
      if (!piece) return null;
      return renderSmilie(piece, `${keyPrefix}-${index}-${pieceIndex}-${piece}`);
    });
  }).flat();
}

function safeUrl(raw: string): string | null {
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function renderFormattedText(body: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\[b\]([\s\S]{1,240}?)\[\/b\]|\[i\]([\s\S]{1,240}?)\[\/i\]|\[url(?:=([^\]]{1,160}))?\]([\s\S]{1,160}?)\[\/url\]/gi;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body))) {
    if (match.index > last) nodes.push(...renderPlainText(body.slice(last, match.index), `plain-${last}`));

    if (match[1]) {
      nodes.push(<strong key={`b-${match.index}`}>{renderPlainText(match[1], `b-${match.index}`)}</strong>);
    } else if (match[2]) {
      nodes.push(<em key={`i-${match.index}`}>{renderPlainText(match[2], `i-${match.index}`)}</em>);
    } else {
      const href = safeUrl(match[3] || match[4] || "");
      const label = match[4] || match[3] || "";
      nodes.push(
        href ? (
          <a key={`url-${match.index}`} href={href} target="_blank" rel="noreferrer nofollow" className="font-bold text-[#0000ee] underline">
            {renderPlainText(label, `url-label-${match.index}`)}
          </a>
        ) : (
          <span key={`bad-url-${match.index}`}>{renderPlainText(label, `bad-url-label-${match.index}`)}</span>
        ),
      );
    }
    last = match.index + match[0].length;
  }
  if (last < body.length) nodes.push(...renderPlainText(body.slice(last), `plain-${last}`));
  return nodes;
}

type Peer = { nick: string; status: UserStatus; color: number; avatar: GuestbookAvatar };

function readStoredNick(): string {
  return readProfile().nick;
}

function readStoredStatus(): UserStatus {
  return readProfile().status;
}

function readAdminToken(): string {
  return sessionAdminToken;
}

export function GuestbookWindow({ notify, playSound, warmSound }: WindowComponentProps) {
  const { visible } = useWindowActivity();
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const messagesRef = useRef<GuestbookMessage[]>([]);
  const pollOffset = useRef(0);
  const [hasOlder, setHasOlder] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [nick, setNick] = useState(readStoredNick);
  const [status, setStatus] = useState<UserStatus>(readStoredStatus);
  const [avatar, setAvatar] = useState<GuestbookAvatar>(() => readProfile().avatar);
  const [draft, setDraft] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState(readAdminToken);

  const logRef = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);
  const lastSeenId = useRef(0);
  const ownNick = useRef("");
  const initialised = useRef(false);

  useEffect(() => {
    ownNick.current = nick;
  }, [nick]);

  useEffect(() => onProfileChange((profile) => {
    setNick(profile.nick);
    setStatus(profile.status);
    setAvatar(profile.avatar);
  }), []);

  useEffect(() => {
    warmSound?.("icq");
  }, [warmSound]);

  const applyMessages = useCallback(
    (incoming: GuestbookMessage[], deletedIds: number[] = []) => {
      setMessages((current) => mergeGuestbookMessages(current, incoming, deletedIds));
      const newest = incoming.length ? incoming[incoming.length - 1].id : 0;
      if (initialised.current && newest > lastSeenId.current) {
        const fromOthers = incoming.some(
          (m) => m.id > lastSeenId.current && m.nick !== ownNick.current,
        );
        if (fromOthers) playSound("icq");
      }
      lastSeenId.current = Math.max(lastSeenId.current, newest);
      initialised.current = true;
    },
    [playSound],
  );

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    if (!visible) return;
    let disposed = false;
    let fetching = false;
    const poll = async () => {
      if (fetching) return;
      fetching = true;
      try {
        const current = messagesRef.current;
        const offset = pollOffset.current % Math.max(1, current.length);
        const checkIds = [...current.slice(offset), ...current.slice(0, offset)].slice(0, 100).map((message) => message.id);
        const snapshot = await fetchGuestbookSnapshot(checkIds);
        if (disposed) return;
        if (!initialised.current) setHasOlder(snapshot.messages.length >= DEFAULT_PAGE_SIZE);
        applyMessages(snapshot.messages, snapshot.deletedIds);
        pollOffset.current += 100;
        setError(null);
      } catch {
        if (!disposed && !initialised.current) setError("Could not connect to #floppyy.");
      } finally {
        fetching = false;
        if (!disposed) setLoading(false);
      }
    };
    void poll();
    const timer = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [applyMessages, visible]);

  const loadOlder = async () => {
    if (loadingOlder || !messages.length) return;
    setLoadingOlder(true);
    const height = logRef.current?.scrollHeight ?? 0;
    const top = logRef.current?.scrollTop ?? 0;
    pinnedToBottom.current = false;
    try {
      const older = await fetchGuestbookPage(messages[0].id);
      setHasOlder(older.length === MAX_PAGE_SIZE);
      setMessages((current) => mergeGuestbookMessages(current, older));
      requestAnimationFrame(() => { if (logRef.current) logRef.current.scrollTop = top + logRef.current.scrollHeight - height; });
    } catch { setError("Could not load older messages."); }
    finally { setLoadingOlder(false); }
  };

  // Keep the log pinned to the newest line, but don't yank the view away while
  // someone is scrolled up reading the old entries.
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    if (!pinnedToBottom.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const peers = useMemo(() => {
    const map = new Map<string, Peer>();
    for (const message of messages) {
      map.set(message.nick, { nick: message.nick, status: message.status, color: message.color, avatar: message.avatar ?? "face-smile" });
    }
    return [...map.values()].sort((a, b) => a.nick.localeCompare(b.nick));
  }, [messages]);

  const send = useCallback(async () => {
    const trimmedNick = nick.trim();
    const trimmedBody = draft.trim();
    if (/^\/admin\s+off$/i.test(trimmedBody) || /^\/logout$/i.test(trimmedBody)) {
      setAdminToken("");
      sessionAdminToken = "";
      setDraft("");
      setError("Operator mode disabled.");
      playSound("click");
      return;
    }
    if (/^\/admin\s+/i.test(trimmedBody)) {
      const token = trimmedBody.replace(/^\/admin\s+/i, "").trim();
      setAdminToken(token);
      sessionAdminToken = token;
      setDraft("");
      setError(token ? "Operator mode enabled." : "Operator token is empty.");
      playSound(token ? "notification" : "error");
      return;
    }
    if (!trimmedNick) {
      setError("Pick a nickname first.");
      playSound("error");
      return;
    }
    if (!trimmedBody || sending) return;

    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nick: trimmedNick, body: trimmedBody, status, avatar, website }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: GuestbookMessage;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Message failed to send.");
        playSound("error");
        return;
      }
      setDraft("");
      try {
        globalThis.localStorage.setItem(NICK_STORAGE_KEY, trimmedNick);
        globalThis.localStorage.setItem(STATUS_STORAGE_KEY, status);
        writeProfile({ nick: trimmedNick, status, avatar });
      } catch {
        /* ignore */
      }
      if (data.message) {
        pinnedToBottom.current = true;
        rememberGuestbookMessage(data.message);
        lastSeenId.current = Math.max(lastSeenId.current, data.message.id);
        setMessages((current) =>
          current.some((m) => m.id === data.message!.id) ? current : [...current, data.message!],
        );
      }
      playSound("icq");
    } catch {
      setError("Network error — message not sent.");
      playSound("error");
    } finally {
      setSending(false);
    }
  }, [nick, draft, status, avatar, website, sending, playSound]);

  const deleteMessage = useCallback(
    async (id: number) => {
      if (!adminToken) return;
      try {
        const response = await fetch(`/api/guestbook?id=${id}`, {
          method: "DELETE",
          headers: { "x-admin-token": adminToken },
        });
        if (!response.ok) throw new Error("delete failed");
        forgetGuestbookMessage(id);
        setMessages((current) => current.filter((message) => message.id !== id));
        setError("Message deleted.");
        playSound("recycle");
      } catch {
        setError("Could not delete message. Check operator token.");
        playSound("error");
      }
    },
    [adminToken, playSound],
  );

  const insertSmilie = useCallback(
    (token: string) => {
      setDraft((current) => {
        const prefix = current && !/\s$/.test(current) ? `${current} ` : current;
        return `${prefix}${token} `.slice(0, BODY_MAX_LENGTH);
      });
      playSound("click");
    },
    [playSound],
  );

  const insertTag = useCallback((tag: "b" | "i" | "url") => {
    setDraft((current) => {
      const snippet = tag === "url" ? "[url]https://[/url]" : `[${tag}][/${tag}]`;
      const prefix = current && !/\s$/.test(current) ? `${current} ` : current;
      return `${prefix}${snippet}`.slice(0, BODY_MAX_LENGTH);
    });
    playSound("click");
  }, [playSound]);

  return (
    <div className="flex h-full flex-col bg-[#c0c0c0] text-[11px]">
      {/* Menu bar */}
      <div className="window-menu-bar">
        {["File", "Edit", "View"].map((item) => (
          <button key={item} className="window-menu-item">
            <span className="underline">{item[0]}</span>
            {item.slice(1)}
          </button>
        ))}
        <button
          className="window-menu-item"
          onClick={() => notify("Sign the Floppyy guestbook — leave a hello for the next visitor!")}
        >
          <span className="underline">H</span>elp
        </button>
      </div>

      {/* Channel topic bar */}
      <div className="field-border mx-[3px] mt-[3px] flex items-center gap-[6px] bg-white px-[6px] py-[3px]">
        <strong className="text-[#000080]">{GUESTBOOK_CHANNEL}</strong>
        <span className="truncate text-[#404040]">
          Topic: Sign the guestbook — mutual respect, no advertising, no spam. est. 1998
        </span>
      </div>

      {/* Body: log + nick list */}
      <div className="mx-[3px] mt-[3px] flex min-h-0 flex-1 gap-[3px]">
        <div
          ref={logRef}
          onScroll={(event) => {
            const el = event.currentTarget;
            pinnedToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
          }}
          className="field-border flex-1 overflow-auto bg-white px-[6px] py-[4px] leading-[1.5]"
          style={{ fontFamily: "'Fixedsys', 'Consolas', monospace" }}
        >
          <div className="text-[#008000]">*** Now talking in {GUESTBOOK_CHANNEL}</div>
          <div className="text-[#008000]">
            *** Topic is &lsquo;Sign the guestbook — say hi to the next visitor!&rsquo;
          </div>
          <div className="text-[#008000]">
            *** Channel rules: 1) Mutual respect &nbsp;2) No advertising &nbsp;3) No spam or flooding
          </div>
          {adminToken && <div className="text-[#000080]">*** Operator mode is active. Click x to remove spam.</div>}
          {hasOlder && messages.length > 0 && <button className="win-button mb-2" disabled={loadingOlder} onClick={() => void loadOlder()}>{loadingOlder ? "Loading..." : "Older messages"}</button>}
          {loading && messages.length === 0 && (
            <div className="text-[#808080]">*** Connecting to server...</div>
          )}
          {!loading && messages.length === 0 && (
            <div className="text-[#808080]">*** No messages yet. Be the first to say hi!</div>
          )}
          {messages.map((message) => (
            <div key={message.id} className="group flex gap-[4px] break-words">
              <GuestbookAvatarIcon avatar={message.avatar ?? "face-smile"} size={20} />
              <div className="min-w-0 flex-1">
                <span className="text-[#808080]">[{timestamp(message.createdAt)}] </span>
                <span style={{ color: nickColor(message.nick, message.color), fontWeight: 700 }}>
                  &lt;{message.nick}&gt;
                </span>{" "}
                <span className="text-black">{renderMessageBody(message.body)}</span>
              </div>
              {adminToken && (
                <button
                  className="h-[15px] w-[15px] shrink-0 border border-[#808080] bg-[#c0c0c0] text-[9px] leading-none"
                  title="Delete message"
                  onClick={() => deleteMessage(message.id)}
                >
                  x
                </button>
              )}
            </div>
          ))}
          {draft.trim().length > 0 && (
            <div className="mt-[2px] text-[#808080]">*** {nick.trim() || "guest"} is typing...</div>
          )}
        </div>

        {/* Nick list with ICQ status flowers */}
        <div className="field-border w-[132px] shrink-0 overflow-auto bg-white px-[4px] py-[3px]">
          <div className="mb-[2px] border-b border-[#c0c0c0] pb-[2px] font-bold text-[#000080]">
            {peers.length} {peers.length === 1 ? "user" : "users"}
          </div>
          {peers.map((peer) => (
            <div key={peer.nick} className="flex items-center gap-[5px] py-[1px]" title={STATUS_META[peer.status].label}>
              <span
                className="icq-flower"
                style={{ "--icq-flower": STATUS_META[peer.status].color } as CSSProperties}
              />
              <GuestbookAvatarIcon avatar={peer.avatar} size={17} />
              <span className="truncate" style={{ color: nickColor(peer.nick, peer.color) }}>
                {peer.nick}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div className="mx-[3px] mt-[3px] flex items-center gap-[4px]">
        <Win98Select
          className="w-[130px]"
          ariaLabel="Your status"
          value={status}
          onChange={(value) => setStatus(value as UserStatus)}
          options={STATUS_OPTIONS.map((value) => ({
            value,
            label: (
              <span className="flex items-center gap-[6px]">
                <span
                  className="icq-flower"
                  style={{ "--icq-flower": STATUS_META[value].color } as CSSProperties}
                />
                {STATUS_META[value].label}
              </span>
            ),
          }))}
        />
        <input
          className="win-bevel-inset h-[22px] w-[120px] px-[4px] text-[11px]"
          placeholder="Nickname"
          maxLength={NICK_MAX_LENGTH}
          value={nick}
          onChange={(event) => setNick(event.target.value)}
        />
        <div className="flex min-w-0 items-center gap-[1px]" aria-label="Guestbook avatars">
          {GUESTBOOK_AVATARS.map((item) => (
            <button
              key={item}
              type="button"
              className="flex h-[22px] w-[22px] shrink-0 items-center justify-center"
              title={AVATAR_LABELS[item]}
              onClick={() => {
                setAvatar(item);
                playSound("click");
              }}
            >
              <GuestbookAvatarIcon avatar={item} size={19} selected={avatar === item} />
            </button>
          ))}
        </div>
      </div>

      <div className="m-[3px] flex items-end gap-[4px]">
        <textarea
          className="win-bevel-inset h-[44px] flex-1 resize-none px-[6px] py-[4px] text-[11px]"
          placeholder={`Message ${GUESTBOOK_CHANNEL}`}
          maxLength={BODY_MAX_LENGTH}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
        />
        <div className="flex shrink-0 flex-col gap-[2px]">
          <div className="flex items-center gap-[2px]" aria-label="ICQ smilies">
            {ICQ_SMILIES.slice(0, 5).map((smilie) => (
              <button
                key={smilie.tokens[0]}
                type="button"
                className="win-button h-[20px] min-w-[21px] px-[2px] text-[9px] font-bold leading-none"
                title={`${smilie.label} ${smilie.tokens[0]}`}
                onClick={() => insertSmilie(smilie.tokens[0])}
              >
                {smilie.face}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-[2px]">
            {(["b", "i", "url"] as const).map((tag) => (
              <button key={tag} type="button" className="win-button h-[20px] min-w-[32px] px-[3px] text-[9px]" onClick={() => insertTag(tag)}>
                [{tag}]
              </button>
            ))}
          </div>
        </div>
        {/* Honeypot — hidden from humans, tempting to bots */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
        />
        <button className="win-button min-w-[64px]" onClick={send} disabled={sending}>
          {sending ? "..." : "Send"}
        </button>
      </div>

      {/* Status bar */}
      <div className="status-bar mx-[3px] mb-[3px]">
        <div className="status-bar-field flex-none px-[8px]">{GUESTBOOK_CHANNEL}</div>
        <div className="status-bar-field truncate">
          {error ? (
            <span className="text-[#a00000]">{error}</span>
          ) : (
            <span>{messages.length} messages · connected as {nick.trim() || "guest"}</span>
          )}
        </div>
      </div>
    </div>
  );
}
