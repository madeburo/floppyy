"use client";

import { FloppyyIcon } from "@/components/desktop/FloppyyIcon";
import { projects } from "@/lib/projects";
import type { WindowComponentProps } from "@/lib/windows";
import { MenuBar } from "./MenuBar";

export function ProjectsWindow({ openWindow, notify }: WindowComponentProps) {
  const visit = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex h-full flex-col">
      <MenuBar onHelp={() => notify("Double click a project folder to view details.")} />
      <div className="field-border mb-2 flex gap-2 bg-white px-2 py-1">
        <span>Address:</span>
        <span className="font-mono">C:\PORTFOLIO\PROJECTS</span>
      </div>
      <div className="sunken-panel min-h-0 flex-1 overflow-auto bg-white">
        <div className="flex min-h-full flex-col">
          <div>
            {projects.map((project) => (
              <div
                key={project.slug}
                className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2 border-b border-[#dfdfdf] p-2 hover:bg-[#000080] hover:text-white"
                onDoubleClick={() => openWindow("project-details", project.slug)}
              >
                <FloppyyIcon type="folder" size={28} />
                <div>
                  <div className="font-bold">{project.name}</div>
                  <div>{project.description}</div>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  <button className="win-button" onClick={() => visit(project.site)}>
                    Visit Site
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-4 border-t border-[#dfdfdf] px-3 py-4">
            <img src="/misc/author-pixel.png" alt="Pixel portrait of Umid" width={48} height={48} className="h-[48px] w-[48px] shrink-0 rounded-sm" style={{ imageRendering: "pixelated" }} />
            <div className="min-w-0 flex-1 text-[11px] text-[#404040]">
              <p className="mb-1 font-bold text-black">Hi, I&apos;m Umid</p>
              <p>CTO, AI Systems Engineer building AI products and independent software projects.</p>
            </div>
            <button className="win-button shrink-0" onClick={() => visit("https://mirzabek.com")}>
              Personal
            </button>
          </div>
        </div>
      </div>
      <div className="status-bar mt-2">
        <p className="status-bar-field">{projects.length} object(s)</p>
        <p className="status-bar-field">Ready</p>
      </div>
    </div>
  );
}
