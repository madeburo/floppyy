"use client";

import type { WindowComponentProps } from "@/lib/windows";
import { MenuBar } from "./MenuBar";

const contacts = [
  ["Email", "hi@floppyy.com"],
  ["Website", "www.floppyy.com"],
  ["Tagline", "The web you grew up on."],
];

export function ContactWindow({ notify, playSound }: WindowComponentProps) {
  const copyEmail = async () => {
    await navigator.clipboard?.writeText("hi@floppyy.com").catch(() => undefined);
    playSound("click");
    notify("Email copied to clipboard.");
  };

  return (
    <div className="flex h-full flex-col">
      <MenuBar onHelp={() => notify("Send a packet. Await reply.")} />
      <div className="win-bevel-inset flex-1 bg-white p-3">
        <div className="mb-3 font-bold">Network Neighborhood / Contact</div>
        <div className="space-y-2">
          {contacts.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[90px_1fr] gap-3">
              <span className="font-bold">{label}</span>
              <span className="font-mono">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <button className="win-button" onClick={copyEmail}>
          Copy Email
        </button>
      </div>
    </div>
  );
}
