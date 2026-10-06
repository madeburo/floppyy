"use client";

import { DesktopWindow, windowDefinitions } from "@/lib/windows";
import { FloppyyIcon } from "@/components/desktop/FloppyyIcon";

const CONTROL_STYLE = {
  background: "#c0c0c0",
  boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf",
} as const;

type Props = {
  window: DesktopWindow;
  active: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
};

export function WindowTitleBar({ window, active, onMinimize, onMaximize, onClose, onPointerDown }: Props) {
  const stopControlDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  const isDialog = windowDefinitions[window.id]?.dialog ?? false;
  const noMaximize = windowDefinitions[window.id]?.noMaximize ?? false;

  return (
    <div
      className={`window-title-bar flex h-[20px] shrink-0 items-center px-[2px] cursor-move select-none touch-none ${
        active
          ? "bg-gradient-to-r from-[#000080] to-[#1084d0]"
          : "bg-gradient-to-r from-[#808080] to-[#b5b5b5]"
      }`}
      onPointerDown={onPointerDown}
    >
      <div
        className="flex flex-1 items-center gap-[3px] min-w-0"
        onDoubleClick={isDialog || noMaximize ? undefined : onMaximize}
      >
        <FloppyyIcon type={window.icon} size={14} />
        <span className="truncate text-[11px] font-bold text-white">{window.title}</span>
      </div>

      {isDialog ? (
        <div className="flex gap-[0px]">
          <button
            onPointerDown={stopControlDrag}
            className="flex h-[16px] w-[16px] items-center justify-center text-[11px] font-bold leading-none text-black"
            style={CONTROL_STYLE}
            aria-label="Help"
          >
            ?
          </button>
          <span className="w-[2px]" />
          <button
            onPointerDown={stopControlDrag}
            onClick={onClose}
            className="flex h-[16px] w-[16px] items-center justify-center"
            style={CONTROL_STYLE}
            aria-label="Close"
          >
            <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
              <path d="M0 0L3 3.5L0 7H1L4 3.5L7 7H8L5 3.5L8 0H7L4 3.5L1 0H0Z" fill="#000" />
            </svg>
          </button>
        </div>
      ) : (
      <div className="flex gap-[0px]">
        <button
          onPointerDown={stopControlDrag}
          onClick={onMinimize}
          className="flex h-[16px] w-[16px] items-center justify-center pb-[1px]"
          style={{
            background: "#c0c0c0",
            boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf"
          }}
          aria-label="Minimize"
        >
          <span className="block h-[2px] w-[6px] bg-black mt-[6px]" />
        </button>
        {!noMaximize && (
          <button
            onPointerDown={stopControlDrag}
            onClick={onMaximize}
            className="flex h-[16px] w-[16px] items-center justify-center"
            style={{
              background: "#c0c0c0",
              boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf"
            }}
            aria-label={window.maximized ? "Restore" : "Maximize"}
          >
            {window.maximized ? (
              <span className="relative">
                <span className="absolute -top-[1px] left-[1px] block h-[7px] w-[7px] border-[1px] border-black border-t-[2px]" />
                <span className="relative block h-[7px] w-[7px] border-[1px] border-black border-t-[2px] bg-[#c0c0c0]" />
              </span>
            ) : (
              <span className="block h-[8px] w-[9px] border-[1px] border-black border-t-[2px]" />
            )}
          </button>
        )}
        <span className="w-[2px]" />
        <button
          onPointerDown={stopControlDrag}
          onClick={onClose}
          className="flex h-[16px] w-[16px] items-center justify-center"
          style={{
            background: "#c0c0c0",
            boxShadow: "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf"
          }}
          aria-label="Close"
        >
          <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
            <path d="M0 0L3 3.5L0 7H1L4 3.5L7 7H8L5 3.5L8 0H7L4 3.5L1 0H0Z" fill="#000"/>
          </svg>
        </button>
      </div>
      )}
    </div>
  );
}
