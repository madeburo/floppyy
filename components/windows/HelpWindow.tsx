"use client";

import { useState, type ReactNode } from "react";
import type { WindowComponentProps } from "@/lib/windows";
import { SHORT_VERSION } from "@/lib/version";

type Topic = {
  id: string;
  title: string;
  body: ReactNode;
};

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      className="inline-block min-w-[18px] px-[5px] py-[1px] text-center text-[11px] not-italic"
      style={{
        background: "#c0c0c0",
        boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf",
      }}
    >
      {children}
    </kbd>
  );
}

function Shortcut({ keys, label }: { keys: ReactNode[]; label: string }) {
  return (
    <li className="flex items-start gap-[8px] py-[3px]">
      <span className="flex shrink-0 items-center gap-[3px]">
        {keys.map((k, i) => (
          <span key={i} className="flex items-center gap-[3px]">
            {i > 0 && <span className="text-[#404040]">+</span>}
            <Kbd>{k}</Kbd>
          </span>
        ))}
      </span>
      <span className="pt-[2px]">{label}</span>
    </li>
  );
}

export function HelpWindow({ openWindow }: WindowComponentProps) {
  const [isMac] = useState(() => {
    const platform = `${navigator.platform} ${navigator.userAgent}`.toLowerCase();
    return platform.includes("mac");
  });
  const [active, setActive] = useState("welcome");

  const ctrl = isMac ? "⌃ Ctrl" : "Ctrl";
  const alt = isMac ? "⌥ Opt" : "Alt";
  const del = isMac ? "⌫ Del" : "Backspace";

  const topics: Topic[] = [
    {
      id: "welcome",
      title: "Welcome to Floppyy",
      body: (
        <div className="space-y-[10px]">
          <p>
            Floppyy is a retro computer that lives in your browser — boot it up, click around, and
            remember the web you grew up on.
          </p>
          <p>
            Use the list on the left to learn the basics, discover keyboard shortcuts, and pick up a
            few tips. When in doubt, just start double-clicking things.
          </p>
          <p className="text-[#000080]">Tip: almost every icon does something. Go explore.</p>
        </div>
      ),
    },
    {
      id: "getting-started",
      title: "Getting Started",
      body: (
        <ul className="list-disc space-y-[6px] pl-[18px]">
          <li><b>Open a program</b> — double-click an icon on the desktop, or pick it from the Start menu.</li>
          <li><b>Move windows</b> — drag the blue title bar. Resize from the bottom-right corner.</li>
          <li><b>Rearrange icons</b> — drag them around the desktop; they snap to a grid.</li>
          <li><b>Delete things</b> — drag a desktop icon onto the Recycle Bin.</li>
          <li><b>Check the date &amp; time</b> — double-click the clock in the taskbar tray.</li>
          <li><b>Right-click the desktop</b> for arrange, refresh and properties.</li>
          <li><b>Change the wallpaper</b> — right-click the desktop (or My Computer) → Properties → Background, and pick from the classic Windows 98 wallpapers.</li>
          <li><b>Go online</b> — open Dial-Up Networking, connect, then browse with Internet Explorer or Netscape.</li>
          <li><b>Sign the Guest Book</b> — open <b>Guest Book (#floppyy)</b> to leave a message in the ICQ/mIRC-style chat. New signings also land in Outlook Express as mail.</li>
          <li><b>Run anything</b> — open <b>Run...</b> and click the arrow to browse recent commands and the full list of programs you can launch.</li>
          <li><b>Play games</b> — open the <b>Games</b> folder on the desktop (or <b>Start → Games</b>). Snake, Tetris, Breakout, Pixel Puzzle, Typing Tutor, Checkers, Minesweeper and Solitaire run right in the desktop. DOS games need a keyboard &amp; mouse — they don&apos;t run on phones or tablets.</li>
        </ul>
      ),
    },
    {
      id: "games",
      title: "Games",
      body: (
        <div className="space-y-[10px]">
          <p>
            Every game lives in the <b>Games</b> folder on the desktop and under <b>Start → Games</b>.
            Double-click one to play.
          </p>
          <ul className="list-disc space-y-[6px] pl-[18px]">
            <li><b>Snake</b>, <b>Tetris</b>, <b>Breakout</b>, <b>Pixel Puzzle</b>, <b>Typing Tutor</b> and <b>Checkers</b> — small Win98-style games with local high scores where it makes sense.</li>
            <li><b>Minesweeper</b> and <b>Solitaire</b> — the Windows classics, playable anywhere.</li>
            <li>
              <b>DOOM</b>, <b>Duke Nukem 3D</b>, <b>Wolfenstein 3D</b>, <b>Dune II</b> and{" "}
              <b>WarCraft: Orcs &amp; Humans</b> — the real MS-DOS games, running right in your browser.
            </li>
          </ul>
          <p className="text-[#000080]">
            <b>Desktop only:</b> the DOS games need a physical keyboard and mouse, so they only run on a
            desktop or laptop computer. On phones and tablets they&apos;ll show a &quot;Desktop only&quot;
            message instead.
          </p>
          <p>
            Click inside a DOS game to capture the mouse and keyboard. In the shooters, move with the
            arrow keys or mouse and fire with <b>{ctrl}</b> or the mouse button.
          </p>
        </div>
      ),
    },
    {
      id: "shortcuts",
      title: "Keyboard Shortcuts",
      body: (
        <div className="space-y-[10px]">
          <ul className="space-y-[2px]">
            <Shortcut keys={[ctrl, "Esc"]} label="Open the Start menu" />
            <Shortcut keys={[alt, "F4"]} label="Close the active window" />
            <Shortcut keys={["Enter"]} label="Open the selected desktop icon" />
            <Shortcut keys={["Esc"]} label="Close menus and pop-ups" />
            <Shortcut keys={[ctrl, alt, del]} label="Restart the system (the three-finger salute)" />
          </ul>
          {isMac && (
            <p className="text-[#000080]">
              On your Mac, the restart combo is ⌃ Control + ⌥ Option + ⌫ Delete (the Delete key
              above Return).
            </p>
          )}
        </div>
      ),
    },
    {
      id: "tips",
      title: "Tips & Secrets",
      body: (
        <div className="space-y-[10px]">
          <p>Floppyy is stuffed with easter eggs. Here&apos;s the full list — no more secrets between us:</p>
          <ul className="list-disc space-y-[7px] pl-[18px]">
            <li>
              <b>Blue Screen of Death</b> — open <b>My Computer</b> four times in a row and watch the
              errors pile up until the whole thing crashes and reboots. Worth it.
            </li>
            <li>
              <b>The three-finger salute</b> — press <b>{ctrl} + {alt} + {del}</b> anytime to crash and
              restart Floppyy on demand.
            </li>
            <li>
              <b>Dangerous commands</b> — type <code>format c:</code>, <code>del *.*</code> or{" "}
              <code>deltree</code> into <b>Run...</b> and say goodbye to your session.
            </li>
            <li>
              <b>Flaky browsers</b> — every so often a page in Internet Explorer or Netscape will throw
              a fatal error and take the system down. Authentic &apos;90s behaviour.
            </li>
            <li>
              <b>Trigger-happy antivirus</b> — a few minutes in, McAfee will &quot;detect a virus.&quot;
              Don&apos;t panic, it&apos;s just messing with you (once per machine).
            </li>
            <li>
              <b>Sore loser</b> — lose at Minesweeper and the computer may inform you your progress is
              gone. Forever.
            </li>
            <li>
              <b>Secret Run words</b> — try <code>llama</code>, <code>nostalgia</code>,{" "}
              <code>clouds</code>, <code>stars</code> or <code>floppyy</code> in the Run box. Also{" "}
              <code>help</code> for the command list.
            </li>
            <li>
              <b>Tossing the essentials</b> — drag My Computer onto the Recycle Bin and Floppyy will
              politely refuse.
            </li>
            <li>
              <b>Hidden credits</b> — double-click the &quot;floppyy&quot; banner on the side of the
              Start menu.
            </li>
            <li>
              <b>Leave it alone</b> — stop touching the mouse for a minute and a screensaver kicks in.
            </li>
          </ul>
          <p className="text-[#808080]">Now go break things responsibly.</p>
        </div>
      ),
    },
    {
      id: "about",
      title: "About Floppyy",
      body: (
        <div className="space-y-[10px]">
          <p><b>Floppyy</b> — the web you grew up on.</p>
          <p>Version {SHORT_VERSION}</p>
          <p>
            Built with a lot of nostalgia. For the full story and credits, open{" "}
            <button className="text-[#0000ff] underline" onClick={() => openWindow("about", "welcome")}>
              About / Credits
            </button>
            .
          </p>
          <p>
            Questions or hello: <a className="text-[#0000ff] underline" href="mailto:hi@floppyy.com">hi@floppyy.com</a>
          </p>
        </div>
      ),
    },
  ];

  const current = topics.find((t) => t.id === active) ?? topics[0];

  return (
    <div className="flex h-full flex-col bg-[#c0c0c0] text-[11px] text-black">
      <div className="flex items-center gap-[12px] border-b border-[#808080] px-[6px] py-[2px]">
        <span className="cursor-default"><span className="underline">F</span>ile</span>
        <span className="cursor-default"><span className="underline">E</span>dit</span>
        <span className="cursor-default"><span className="underline">B</span>ookmark</span>
        <span className="cursor-default"><span className="underline">O</span>ptions</span>
        <span className="cursor-default"><span className="underline">H</span>elp</span>
      </div>

      <div className="flex min-h-0 flex-1 gap-[6px] p-[6px]">
        <div
          className="w-[170px] shrink-0 overflow-auto bg-white p-[3px]"
          style={{ boxShadow: "inset -1px -1px #ffffff, inset 1px 1px #808080, inset -2px -2px #dfdfdf, inset 2px 2px #0a0a0a" }}
        >
          <div className="mb-[4px] flex items-center gap-[6px] px-[2px] py-[1px] font-bold">
            <img src="/icons/help.png" alt="" width={16} height={16} style={{ imageRendering: "pixelated" }} draggable={false} />
            Contents
          </div>
          {topics.map((topic) => (
            <button
              key={topic.id}
              className="flex w-full items-center gap-[6px] px-[4px] py-[2px] text-left"
              style={
                active === topic.id
                  ? { background: "#000080", color: "#ffffff" }
                  : undefined
              }
              onClick={() => setActive(topic.id)}
            >
              <span className="text-[10px]">📖</span>
              <span className="truncate">{topic.title}</span>
            </button>
          ))}
        </div>

        <div
          className="min-w-0 flex-1 overflow-auto bg-white p-[12px] leading-[16px]"
          style={{ boxShadow: "inset -1px -1px #ffffff, inset 1px 1px #808080, inset -2px -2px #dfdfdf, inset 2px 2px #0a0a0a" }}
        >
          <h2 className="mb-[10px] text-[15px] font-bold text-[#000080]">{current.title}</h2>
          {current.body}
        </div>
      </div>
    </div>
  );
}
