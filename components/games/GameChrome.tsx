"use client";

import { useEffect, useRef, useState } from "react";

type SubMenuItem = {
  label: string;
  onClick?: () => void;
  shortcut?: string;
  separatorBefore?: boolean;
  checked?: boolean;
  disabled?: boolean;
};

type MenuItem = {
  label: string;
  onClick?: () => void;
  menu?: SubMenuItem[];
};

export function GameMenuBar({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div
      ref={barRef}
      className="game-menu-bar relative flex h-[20px] shrink-0 items-center gap-[18px] bg-[#c0c0c0] px-[4px] text-[11px] leading-none"
    >
      {items.map((item) => {
        const isOpen = open === item.label;
        const handleClick = () => {
          if (item.menu && item.menu.length > 0) {
            setOpen((curr) => (curr === item.label ? null : item.label));
          } else {
            item.onClick?.();
          }
        };
        return (
          <div key={item.label} className="relative">
            <button
              aria-label={item.label}
              className={`flex h-[18px] items-center px-[6px] leading-none ${isOpen ? "bg-[#000080] text-white" : "active:bg-[#000080] active:text-white"}`}
              onClick={handleClick}
            >
              <span className="underline">{item.label[0]}</span>
              {item.label.slice(1)}
            </button>
            {item.menu && isOpen && (
              <div
                className="absolute left-0 top-[19px] z-50 min-w-[168px] border border-[#dfdfdf] border-b-[#000] border-r-[#000] bg-[#c0c0c0] p-[2px] text-[11px] shadow-[2px_2px_0_rgba(0,0,0,0.35)]"
              >
                {item.menu.map((sub) => (
                  <div key={sub.label}>
                    {sub.separatorBefore && (
                      <div className="my-[3px] h-px bg-[#808080] shadow-[0_1px_#fff]" />
                    )}
                    <button
                      disabled={sub.disabled}
                      className={`group flex w-full items-center py-[3px] pr-[16px] text-left ${
                        sub.disabled ? "text-[#808080]" : "hover:bg-[#000080] hover:text-white"
                      }`}
                      onClick={() => {
                        setOpen(null);
                        sub.onClick?.();
                      }}
                    >
                      <span className="flex w-[20px] shrink-0 items-center justify-center">
                        {sub.checked ? "\u2713" : ""}
                      </span>
                      <span className="flex-1 whitespace-nowrap pr-[24px]">{sub.label}</span>
                      {sub.shortcut && (
                        <span
                          className={`whitespace-nowrap ${
                            sub.disabled ? "text-[#808080]" : "text-[#404040] group-hover:text-white"
                          }`}
                        >
                          {sub.shortcut}
                        </span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function GameStatusBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-[2px] flex h-[20px] shrink-0 items-center bg-[#c0c0c0] px-[5px] text-[11px] shadow-[inset_1px_1px_#808080,inset_-1px_-1px_#fff]">
      {children}
    </div>
  );
}
