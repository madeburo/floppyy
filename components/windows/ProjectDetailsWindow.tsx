"use client";

import { projects } from "@/lib/projects";
import type { WindowComponentProps } from "@/lib/windows";

export function ProjectDetailsWindow({ window, openWindow }: WindowComponentProps) {
  const project = projects.find((item) => item.slug === window.payload);
  const visit = (url: string) => {
    globalThis.window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!project) {
    return (
      <div className="flex h-full flex-col gap-3">
        <p>This project is no longer listed.</p>
        <div className="mt-auto flex justify-end">
          <button className="win-button" onClick={() => openWindow("projects")}>Open Projects</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="win-bevel-inset bg-white p-3">
        <h2 className="mb-2 text-lg font-bold">{project.name}</h2>
        <p>{project.details}</p>
      </div>
      <div className="grid grid-cols-[90px_1fr] gap-2">
        <span className="font-bold">Stack</span>
        <span>{project.stack.join(", ")}</span>
      </div>
      <div className="mt-auto flex justify-end gap-2">
        <button className="win-button" onClick={() => visit(project.site)}>
          Visit Site
        </button>
      </div>
    </div>
  );
}
