"use client";

import { useRef } from "react";
import { DesktopWindow, windowDefinitions } from "@/lib/windows";
import { WindowTitleBar } from "./WindowTitleBar";

type Props = {
  window: DesktopWindow;
  active: boolean;
  children: React.ReactNode;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
};

export function WindowFrame({ window, active, children, onFocus, onClose, onMinimize, onMaximize, onMove, onResize }: Props) {
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const resize = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const viewportWidth = "min(100vw, var(--viewport-width, 100vw))";
  const viewportHeight = "min(100dvh, var(--viewport-height, 100dvh))";

  const style = window.maximized
    ? { left: "var(--viewport-left, 0px)", top: "var(--viewport-top, 0px)", width: viewportWidth, height: `calc(${viewportHeight} - 28px)`, zIndex: window.zIndex }
    : {
        left: `clamp(calc(var(--viewport-left, 0px) + 8px), ${window.x}px, calc(var(--viewport-left, 0px) + ${viewportWidth} - min(${window.width}px, ${viewportWidth} - 16px) - 8px))`,
        top: `clamp(calc(var(--viewport-top, 0px) + 8px), ${window.y}px, calc(var(--viewport-top, 0px) + ${viewportHeight} - min(${window.height}px, ${viewportHeight} - 44px) - 36px))`,
        width: `min(${window.width}px, ${viewportWidth} - 16px)`,
        height: `min(${window.height}px, ${viewportHeight} - 44px)`,
        zIndex: window.zIndex,
      };

  return (
    <div
      className={`fixed flex flex-col ${window.minimized ? "hidden" : ""}`}
      style={{
        ...style,
        background: "#c0c0c0",
        boxShadow: active
          ? "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf"
          : "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf",
        padding: "3px",
      }}
      onPointerDown={onFocus}
      onPointerMove={(event) => {
        if (drag.current) {
          onMove(event.clientX - drag.current.dx, event.clientY - drag.current.dy);
          return;
        }
        if (resize.current) {
          const newWidth = Math.max(200, resize.current.width + event.clientX - resize.current.x);
          const newHeight = Math.max(100, resize.current.height + event.clientY - resize.current.y);
          onResize(newWidth, newHeight);
        }
      }}
      onPointerUp={() => {
        drag.current = null;
        resize.current = null;
      }}
      role="dialog"
      aria-label={window.title}
    >
      <WindowTitleBar
        window={window}
        active={active}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
        onClose={onClose}
        onPointerDown={(event) => {
          if (window.maximized) return;
          onFocus();
          const rect = event.currentTarget.parentElement!.getBoundingClientRect();
          drag.current = { dx: event.clientX - rect.x, dy: event.clientY - rect.y };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
      />
      <div className="min-h-0 flex-1 overflow-auto bg-[#c0c0c0] mt-[1px] p-[4px]">
        {children}
      </div>

      {!window.maximized && !windowDefinitions[window.id]?.dialog && (
        <div
          className="absolute bottom-0 right-0 h-[16px] w-[16px] cursor-se-resize touch-none"
          onPointerDown={(event) => {
            event.stopPropagation();
            onFocus();
            resize.current = { x: event.clientX, y: event.clientY, width: window.width, height: window.height };
            (event.target as HTMLElement).setPointerCapture(event.pointerId);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute bottom-0 right-0">
            <path d="M14 4V14H4" stroke="#fff" strokeWidth="1"/>
            <path d="M14 7V14H7" stroke="#808080" strokeWidth="1"/>
            <path d="M14 10V14H10" stroke="#fff" strokeWidth="1"/>
            <path d="M14 13V14H13" stroke="#808080" strokeWidth="1"/>
          </svg>
        </div>
      )}
    </div>
  );
}
