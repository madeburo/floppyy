"use client";

import type { ReactNode } from "react";

type Props = {
  x: number;
  y: number;
  target?: string;
  onOpen: () => void;
  onArrangeIcons: () => void;
  onLineUpIcons: () => void;
  onRefresh: () => void;
  onProperties: () => void;
  onEmptyRecycleBin: () => void;
  onNotify: (message: string) => void;
  onClose: () => void;
};

const MENU_SHADOW =
  "inset -1px -1px #0a0a0a, inset 1px 1px #ffffff, inset -2px -2px #808080, inset 2px 2px #dfdfdf";

function Separator() {
  return <div className="mx-[2px] my-[3px] h-[1px] bg-[#808080] shadow-[0_1px_0_#fff]" />;
}

function Flyout({ children }: { children: ReactNode }) {
  return (
    <div
      className="absolute left-full top-[-3px] z-[5001] ml-[-1px] hidden min-w-[150px] bg-[#c0c0c0] py-[2px] group-hover:block"
      style={{ boxShadow: MENU_SHADOW }}
    >
      {children}
    </div>
  );
}

export function ContextMenu({
  x,
  y,
  target,
  onOpen,
  onArrangeIcons,
  onLineUpIcons,
  onRefresh,
  onProperties,
  onEmptyRecycleBin,
  onNotify,
  onClose,
}: Props) {
  // Wrap every action so the menu always dismisses after a click.
  const act = (fn?: () => void) => () => {
    fn?.();
    onClose();
  };
  const cannotCreate = () =>
    onNotify("Creating new items isn't supported on the Floppyy desktop.");

  return (
    <div
      className="fixed z-[5000] min-w-[168px] bg-[#c0c0c0] py-[2px]"
      style={{ left: x, top: y, boxShadow: MENU_SHADOW }}
      role="menu"
      onClick={(event) => event.stopPropagation()}
    >
      {target && (
        <>
          <button className="menu-command font-bold" onClick={act(onOpen)}>
            Open
          </button>
          {target === "recycle" && (
            <button className="menu-command" onClick={act(onEmptyRecycleBin)}>
              Empty Recycle Bin
            </button>
          )}
          <Separator />
          <button className="menu-command" onClick={act(onProperties)}>
            Properties
          </button>
        </>
      )}

      {!target && (
        <>
          <div className="group relative">
            <button className="menu-command flex items-center justify-between gap-[16px]">
              <span>Active Desktop</span>
              <span className="text-[9px] leading-none">▶</span>
            </button>
            <Flyout>
              <button
                className="menu-command"
                onClick={act(() => onNotify("Active Desktop is not available — this desktop stays classic."))}
              >
                View As Web Page
              </button>
              <button className="menu-command" onClick={act(onProperties)}>
                Customize my Desktop...
              </button>
              <button className="menu-command" onClick={act(onRefresh)}>
                Update Now
              </button>
            </Flyout>
          </div>

          <Separator />

          <div className="group relative">
            <button className="menu-command flex items-center justify-between gap-[16px]">
              <span>Arrange Icons</span>
              <span className="text-[9px] leading-none">▶</span>
            </button>
            <Flyout>
              <button className="menu-command" onClick={act(onArrangeIcons)}>
                by Name
              </button>
              <button className="menu-command" onClick={act(onArrangeIcons)}>
                by Type
              </button>
              <button className="menu-command" onClick={act(onArrangeIcons)}>
                by Size
              </button>
              <button className="menu-command" onClick={act(onArrangeIcons)}>
                by Date
              </button>
              <Separator />
              <button className="menu-command" onClick={act(onArrangeIcons)}>
                Auto Arrange
              </button>
            </Flyout>
          </div>

          <button className="menu-command" onClick={act(onLineUpIcons)}>
            Line Up Icons
          </button>
          <button className="menu-command" onClick={act(onArrangeIcons)}>
            Restore Desktop Layout
          </button>

          <Separator />

          <button className="menu-command" onClick={act(onRefresh)}>
            Refresh
          </button>

          <Separator />

          <button className="menu-command" aria-disabled="true">
            Paste
          </button>
          <button className="menu-command" aria-disabled="true">
            Paste Shortcut
          </button>

          <Separator />

          <div className="group relative">
            <button className="menu-command flex items-center justify-between gap-[16px]">
              <span>New</span>
              <span className="text-[9px] leading-none">▶</span>
            </button>
            <Flyout>
              <button className="menu-command" onClick={act(cannotCreate)}>
                Folder
              </button>
              <button className="menu-command" onClick={act(cannotCreate)}>
                Shortcut
              </button>
              <Separator />
              <button className="menu-command" onClick={act(cannotCreate)}>
                Text Document
              </button>
              <button className="menu-command" onClick={act(cannotCreate)}>
                WordPad Document
              </button>
              <button className="menu-command" onClick={act(cannotCreate)}>
                Bitmap Image
              </button>
              <button className="menu-command" onClick={act(cannotCreate)}>
                Wave Sound
              </button>
              <button className="menu-command" onClick={act(cannotCreate)}>
                Microsoft Data Link
              </button>
              <button className="menu-command" onClick={act(cannotCreate)}>
                Briefcase
              </button>
            </Flyout>
          </div>

          <Separator />

          <button className="menu-command" onClick={act(onProperties)}>
            Properties
          </button>
        </>
      )}
    </div>
  );
}
