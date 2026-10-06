"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

export function Win98Dialog({ title, children, onCancel }: { title: string; children: ReactNode; onCancel?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button:not(:disabled), input")?.focus();
    return () => previous?.focus();
  }, []);
  return (
    <div className="absolute inset-0 z-[9000] flex items-center justify-center bg-black/20 p-2" onPointerDown={(event) => event.stopPropagation()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className="win-bevel w-[320px] max-w-full bg-[#c0c0c0] p-[3px] text-[12px] text-black"
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Escape") { event.preventDefault(); onCancel?.(); }
          if (event.key !== "Tab") return;
          const controls = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]') ?? []);
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}>
        <div id={titleId} className="bg-gradient-to-r from-[#000080] to-[#1084d0] px-2 py-1 font-bold text-white">{title}</div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
