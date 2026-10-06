export type Project = {
  slug: string;
  name: string;
  description: string;
  status: string;
  stack: string[];
  site: string;
  details: string;
};

export const projects: Project[] = [
  {
    slug: "usagenow",
    name: "UsageNow",
    description: "AI coding usage tracker for macOS. Limits, resets, and activity for Codex, Claude, Gemini, Grok and more",
    status: "Online",
    stack: ["macOS", "AI Coding", "Usage Tracking"],
    site: "https://www.usagenow.com",
    details: "AI coding usage tracker for macOS. Limits, resets, and activity for Codex, Claude, Gemini, Grok and more",
  },
  {
    slug: "brewwery",
    name: "Brewwery",
    description: "GUI for Homebrew, native macOS app",
    status: "Online",
    stack: ["macOS", "Homebrew", "Desktop"],
    site: "https://www.brewwery.com",
    details: "GUI for Homebrew",
  },
  {
    slug: "openmodels",
    name: "OpenModels",
    description: "Open Registry & Telemetry for AI Infrastructure.",
    status: "Online",
    stack: ["AI Infrastructure", "Registry", "Telemetry"],
    site: "https://www.openmodels.run",
    details: "Open Registry & Telemetry for AI Infrastructure.",
  },
];
