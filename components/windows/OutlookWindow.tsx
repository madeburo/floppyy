"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WindowComponentProps } from "@/lib/windows";
import { fetchGuestbookMessages } from "@/lib/guestbook/client";
import { useWindowActivity } from "./WindowActivity";

type Folder = "inbox" | "outbox" | "sent" | "deleted" | "drafts";

type Email = {
  id: string;
  folder: Folder;
  from: string;
  to: string;
  subject: string;
  date: string;
  ts: number;
  body: string;
  read: boolean;
};

const FOLDER_DEFS: { key: Folder; label: string; icon: string }[] = [
  { key: "inbox", label: "Inbox", icon: "📥" },
  { key: "outbox", label: "Outbox", icon: "📤" },
  { key: "sent", label: "Sent Items", icon: "📨" },
  { key: "deleted", label: "Deleted Items", icon: "🗑️" },
  { key: "drafts", label: "Drafts", icon: "📝" },
];

const MY_ADDRESS = "you@floppyy.com";

function formatDate(d: Date = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  let h = d.getHours();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd}/${yy} ${h}:${min} ${ap}`;
}

const INITIAL_EMAILS: Email[] = [
  {
    id: "welcome",
    folder: "inbox",
    from: "The Floppyy Team",
    to: MY_ADDRESS,
    subject: "Welcome to Outlook Express!",
    date: "06/26/98 12:00 AM",
    ts: new Date("1998-06-26T00:00:00").getTime(),
    read: false,
    body: `Dear User,

Welcome to Outlook Express on Floppyy!

This is your retro email client. Try composing a message with New Mail — it will drop into your Outbox and get "delivered" a couple of seconds later.

New signings in the #floppyy Guest Book will also arrive right here in your Inbox.

Best regards,
The Floppyy Team
hi@floppyy.com`,
  },
  {
    id: "msn",
    folder: "inbox",
    from: "MSN Member Services",
    to: MY_ADDRESS,
    subject: "Welcome to MSN!",
    date: "06/25/98 09:41 AM",
    ts: new Date("1998-06-25T09:41:00").getTime(),
    read: false,
    body: `Welcome to The Microsoft Network!

You are now connected to the world at a blazing 56 kbps. Please do not use the telephone while online.

Your free 100 hours expire in 30 days. Keep this CD — you may need to reinstall.

See you on the information superhighway!
— MSN Member Services`,
  },
];

type GbMessage = { id: number; nick: string; body: string; createdAt: string };

export function OutlookWindow({ notify, playSound }: WindowComponentProps) {
  const { visible } = useWindowActivity();
  const [emails, setEmails] = useState<Email[]>(INITIAL_EMAILS);
  const [folder, setFolder] = useState<Folder>("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ to: "", subject: "", body: "" });

  const idCounter = useRef(0);
  const seenGuestbook = useRef<Set<number>>(new Set());
  const guestbookInit = useRef(false);
  const nextId = () => `msg-${(idCounter.current += 1)}`;

  const unreadIn = (f: Folder) => emails.filter((e) => e.folder === f && !e.read).length;
  const countIn = (f: Folder) => emails.filter((e) => e.folder === f).length;

  const folderEmails = emails
    .filter((e) => e.folder === folder)
    .sort((a, b) => b.ts - a.ts);
  const selected = emails.find((e) => e.id === selectedId) ?? null;

  const selectEmail = useCallback(
    (id: string) => {
      setSelectedId(id);
      setEmails((prev) => prev.map((e) => (e.id === id && !e.read ? { ...e, read: true } : e)));
    },
    [],
  );

  // ── Guestbook → Inbox bridge ────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    let active = true;

    const makeEmail = (m: GbMessage, read: boolean): Email => ({
      id: `gb-${m.id}`,
      folder: "inbox",
      from: `${m.nick} (#floppyy)`,
      to: MY_ADDRESS,
      subject: `New guestbook signing from ${m.nick}`,
      date: formatDate(new Date(m.createdAt)),
      ts: new Date(m.createdAt).getTime() || Date.now(),
      read,
      body: `${m.nick} just signed the #floppyy Guest Book:\n\n"${m.body}"\n\n— delivered by the Floppyy Guest Book`,
    });

    const poll = async () => {
      try {
        const messages = await fetchGuestbookMessages();
        if (!active) return;
        const known = seenGuestbook.current;
        const fresh = messages.filter((m) => !known.has(m.id));
        const firstLoad = !guestbookInit.current;
        guestbookInit.current = true;
        if (fresh.length === 0) return;
        fresh.forEach((m) => known.add(m.id));
        const newEmails = fresh.map((m) => makeEmail(m, firstLoad));
        setEmails((prev) => [...prev, ...newEmails]);
        if (!firstLoad) {
          playSound("mail");
          notify("You have new mail.", { balloon: true });
        }
      } catch {
        /* guestbook offline — ignore */
      }
    };

    poll();
    const timer = window.setInterval(poll, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [playSound, notify, visible]);

  // ── Compose / send ────────────────────────────────────────────────────────
  const openCompose = (prefill?: Partial<typeof draft>) => {
    setDraft({ to: prefill?.to ?? "", subject: prefill?.subject ?? "", body: prefill?.body ?? "" });
    setComposing(true);
    playSound("click");
  };

  const sendMail = () => {
    const to = draft.to.trim() || MY_ADDRESS;
    const subject = draft.subject.trim() || "(no subject)";
    const body = draft.body;
    const now = Date.now();
    const outId = nextId();

    setEmails((prev) => [
      ...prev,
      { id: outId, folder: "outbox", from: MY_ADDRESS, to, subject, date: formatDate(), ts: now, read: true, body },
    ]);
    setComposing(false);
    setFolder("outbox");
    playSound("click");

    // A couple of seconds later the message "leaves" the Outbox: it lands in
    // Sent Items and a copy is delivered back to the Inbox.
    window.setTimeout(() => {
      const deliveredId = nextId();
      setEmails((prev) => [
        ...prev.map((e) => (e.id === outId ? { ...e, folder: "sent" as Folder } : e)),
        {
          id: deliveredId,
          folder: "inbox",
          from: to,
          to: MY_ADDRESS,
          subject,
          date: formatDate(),
          ts: Date.now(),
          read: false,
          body,
        },
      ]);
      playSound("mail");
      notify("You have new mail.", { balloon: true });
    }, 2200);
  };

  const deleteSelected = () => {
    if (!selected) return;
    if (selected.folder === "deleted") {
      setEmails((prev) => prev.filter((e) => e.id !== selected.id));
    } else {
      setEmails((prev) => prev.map((e) => (e.id === selected.id ? { ...e, folder: "deleted" } : e)));
    }
    setSelectedId(null);
    playSound("recycle");
  };

  const replySelected = () => {
    if (!selected) return;
    openCompose({
      to: selected.from,
      subject: selected.subject.startsWith("Re:") ? selected.subject : `Re: ${selected.subject}`,
      body: `\n\n----- Original Message -----\nFrom: ${selected.from}\nSubject: ${selected.subject}\n\n${selected.body}`,
    });
  };

  const toolbarBtn = "flex flex-col items-center justify-center h-[36px] min-w-[46px] px-1 text-[9px] hover:bg-[#dfdfdf] cursor-default disabled:opacity-40";

  return (
    <div className="flex h-full flex-col bg-[#c0c0c0]">
      {/* Menu bar */}
      <div className="flex h-[20px] items-center border-b border-[#808080] px-1 text-[11px]">
        {["File", "Edit", "View", "Tools", "Message", "Help"].map((m) => (
          <span key={m} className="cursor-default px-2 hover:underline">{m}</span>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex h-[42px] items-center gap-1 border-b border-[#808080] px-2">
        <button className={toolbarBtn} onClick={() => openCompose()}>
          <span className="text-[15px]">✉️</span>
          <span>New Mail</span>
        </button>
        <button className={toolbarBtn} onClick={replySelected} disabled={!selected}>
          <span className="text-[15px]">↩️</span>
          <span>Reply</span>
        </button>
        <button className={toolbarBtn} onClick={deleteSelected} disabled={!selected}>
          <span className="text-[15px]">🗑️</span>
          <span>Delete</span>
        </button>
        <div className="mx-1 h-[30px] w-px bg-[#808080]" />
        <button
          className={toolbarBtn}
          onClick={() => {
            playSound("click");
            notify("Send/Receive complete. No new messages on the server.", { balloon: true });
          }}
        >
          <span className="text-[15px]">📬</span>
          <span>Send/Recv</span>
        </button>
      </div>

      {/* Blue header */}
      <div className="flex h-[22px] items-center bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 text-[12px] font-bold text-white">
        <img src="/icons/msoutlook.png" alt="" width={16} height={16} className="mr-2" style={{ imageRendering: "pixelated" }} draggable={false} />
        {composing ? "New Message" : "Outlook Express"}
      </div>

      {composing ? (
        <ComposeView
          draft={draft}
          setDraft={setDraft}
          onSend={sendMail}
          onCancel={() => {
            setComposing(false);
            playSound("click");
          }}
        />
      ) : (
        <div className="flex min-h-0 flex-1">
          {/* Folder panel */}
          <div className="w-[150px] shrink-0 overflow-auto border-r border-[#808080] bg-white p-1 text-[11px]">
            <div className="mb-[3px] px-1 font-bold">Folders</div>
            {FOLDER_DEFS.map((f) => {
              const badge = f.key === "inbox" ? unreadIn("inbox") : f.key === "outbox" ? countIn("outbox") : 0;
              const active = folder === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => {
                    setFolder(f.key);
                    setSelectedId(null);
                    playSound("click");
                  }}
                  className={`flex w-full items-center gap-[5px] px-[6px] py-[2px] text-left ${
                    active ? "bg-[#000080] text-white" : "hover:bg-[#e8e8e8]"
                  }`}
                >
                  <span className="text-[12px]">{f.icon}</span>
                  <span className={badge > 0 ? "font-bold" : ""}>
                    {f.label}
                    {badge > 0 ? ` (${badge})` : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Message list + preview */}
          <div className="flex min-w-0 flex-1 flex-col bg-white">
            {/* List */}
            <div className="flex min-h-[70px] flex-[3] flex-col overflow-auto border-b border-[#808080]">
              <div className="sticky top-0 flex h-[18px] shrink-0 items-center border-b border-[#808080] bg-[#c0c0c0] px-2 text-[10px] font-bold">
                <span className="w-[150px]">From</span>
                <span className="flex-1">Subject</span>
                <span className="w-[120px]">Received</span>
              </div>
              {folderEmails.length === 0 ? (
                <div className="p-3 text-[11px] text-[#808080]">There are no items in this view.</div>
              ) : (
                folderEmails.map((email) => {
                  const isSel = email.id === selectedId;
                  return (
                    <div
                      key={email.id}
                      onClick={() => selectEmail(email.id)}
                      className={`flex h-[18px] cursor-default items-center px-2 text-[10px] ${
                        isSel ? "bg-[#000080] text-white" : "hover:bg-[#e8e8e8]"
                      } ${!email.read ? "font-bold" : ""}`}
                    >
                      <span className="w-[16px]">{email.read ? "📄" : "✉️"}</span>
                      <span className="w-[134px] truncate">{email.from}</span>
                      <span className="flex-1 truncate">{email.subject}</span>
                      <span className="w-[120px] truncate">{email.date}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Preview */}
            <div className="flex flex-[2] flex-col overflow-auto">
              {selected ? (
                <>
                  <div className="border-b border-[#c0c0c0] bg-[#f5f5f5] px-3 py-2 text-[11px]">
                    <div><strong>From:</strong> {selected.from}</div>
                    <div><strong>To:</strong> {selected.to}</div>
                    <div><strong>Subject:</strong> {selected.subject}</div>
                    <div><strong>Date:</strong> {selected.date}</div>
                  </div>
                  <pre className="flex-1 overflow-auto whitespace-pre-wrap px-3 py-2 text-[11px] font-[system-ui]">
                    {selected.body}
                  </pre>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-[11px] text-[#808080]">
                  Select a message to read it.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="flex h-[20px] items-center gap-2 border-t border-[#dfdfdf] px-2 text-[10px]">
        <span>📧 {emails.filter((e) => e.folder === "inbox").length} message(s), {unreadIn("inbox")} unread</span>
        <span className="ml-auto">🌐 Working Online</span>
      </div>
    </div>
  );
}

function ComposeView({
  draft,
  setDraft,
  onSend,
  onCancel,
}: {
  draft: { to: string; subject: string; body: string };
  setDraft: (d: { to: string; subject: string; body: string }) => void;
  onSend: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#c0c0c0] p-[6px] text-[11px]">
      <div className="mb-[6px] flex gap-[6px]">
        <button className="win-button min-w-[70px]" onClick={onSend}>Send</button>
        <button className="win-button min-w-[70px]" onClick={onCancel}>Cancel</button>
      </div>
      <div className="grid grid-cols-[60px_1fr] items-center gap-[4px]">
        <label className="text-right">To:</label>
        <input
          className="win-bevel-inset h-[20px] bg-white px-[4px]"
          value={draft.to}
          onChange={(e) => setDraft({ ...draft, to: e.target.value })}
          placeholder={MY_ADDRESS}
        />
        <label className="text-right">Subject:</label>
        <input
          className="win-bevel-inset h-[20px] bg-white px-[4px]"
          value={draft.subject}
          onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
        />
      </div>
      <textarea
        className="win-bevel-inset mt-[6px] min-h-0 flex-1 resize-none bg-white p-[6px] text-[11px]"
        value={draft.body}
        onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        placeholder="Type your message..."
        autoFocus
      />
    </div>
  );
}
