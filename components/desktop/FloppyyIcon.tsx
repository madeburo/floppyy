"use client";

import { useState } from "react";

type Props = {
  type: string;
  size?: number;
};

export function FloppyyIcon({ type, size = 32 }: Props) {
  const [useFallback, setUseFallback] = useState(false);
  const s = size;
  const source = `/icons/${type}.png`;

  if (!useFallback) {
    return (
      <span aria-hidden="true" className="inline-flex items-center justify-center" style={{ width: s, height: s }}>
        <img
          src={source}
          alt=""
          width={s}
          height={s}
          style={{ imageRendering: "pixelated", width: s, height: s }}
          onError={() => setUseFallback(true)}
          draggable={false}
        />
      </span>
    );
  }

  return (
    <span aria-hidden="true" className="inline-flex items-center justify-center" style={{ width: s, height: s }}>
      <FallbackSVG type={type} size={s} />
    </span>
  );
}

function FallbackSVG({ type, size: s }: { type: string; size: number }) {
  const common = { shapeRendering: "crispEdges" as const };

  switch (type) {
    case "computer":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <rect x="6" y="2" width="20" height="17" fill="#d8d8d8" stroke="#000"/>
          <rect x="8" y="4" width="16" height="11" fill="#008080"/>
          <rect x="9" y="5" width="14" height="9" fill="#79d6d0"/>
          <rect x="11" y="19" width="10" height="3" fill="#bfbfbf" stroke="#000"/>
          <rect x="8" y="22" width="16" height="3" fill="#d8d8d8" stroke="#000"/>
          <rect x="5" y="26" width="22" height="3" fill="#bfbfbf" stroke="#000"/>
          <rect x="22" y="16" width="2" height="1" fill="#00ff00"/>
        </svg>
      );
    case "folder":
    case "documents":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <path d="M2 9H12L14 12H30V27H2V9Z" fill="#ffe86b" stroke="#000"/>
          <path d="M3 13H29V28H3V13Z" fill="#fff28c" stroke="#8c7b00"/>
          <rect x="4" y="15" width="24" height="1" fill="#fffbd0"/>
        </svg>
      );
    case "mail":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <rect x="3" y="7" width="26" height="18" fill="#fff" stroke="#000"/>
          <path d="M3 7 L16 17 L29 7" fill="none" stroke="#000"/>
          <path d="M3 25 L12 17" stroke="#808080" strokeWidth="0.5"/>
          <path d="M29 25 L20 17" stroke="#808080" strokeWidth="0.5"/>
          <rect x="22" y="9" width="5" height="4" fill="#ff0000" stroke="#800000" strokeWidth="0.5"/>
        </svg>
      );
    case "trash":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <path d="M8 11H25L22 28H11L8 11Z" fill="#d8f2e2" stroke="#000"/>
          <rect x="7" y="8" width="18" height="3" fill="#f4fff8" stroke="#000"/>
          <rect x="13" y="5" width="6" height="3" fill="#d8f2e2" stroke="#000"/>
          <path d="M12 13L14 26M17 13V26M22 13L20 26" stroke="#63a57f"/>
        </svg>
      );
    case "joystick":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <ellipse cx="16" cy="25" rx="10" ry="4" fill="#c0c0c0" stroke="#000"/>
          <rect x="14" y="8" width="4" height="16" fill="#404040" stroke="#000" strokeWidth="0.5"/>
          <circle cx="16" cy="7" r="4" fill="#ff0000" stroke="#800000"/>
          <circle cx="14" cy="5" r="1.5" fill="#ff8080"/>
          <circle cx="8" cy="23" r="2" fill="#ff0000" stroke="#800000" strokeWidth="0.5"/>
          <circle cx="24" cy="23" r="2" fill="#0000ff" stroke="#000080" strokeWidth="0.5"/>
        </svg>
      );
    case "music":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <circle cx="16" cy="16" r="12" fill="#c0c0c0" stroke="#000"/>
          <circle cx="16" cy="16" r="10" fill="#e8e8ff"/>
          <circle cx="16" cy="16" r="3" fill="#fff" stroke="#808080" strokeWidth="0.5"/>
          <circle cx="16" cy="16" r="1" fill="#000"/>
        </svg>
      );
    case "winamp":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <rect x="4" y="6" width="24" height="20" fill="#1f2340" stroke="#000"/>
          <rect x="6" y="8" width="20" height="3" fill="#c0c0c0"/>
          <rect x="7" y="13" width="10" height="8" fill="#050505" stroke="#5a5a5a"/>
          <rect x="19" y="13" width="6" height="8" fill="#111"/>
          <rect x="20" y="14" width="1" height="5" fill="#2dff22"/>
          <rect x="23" y="15" width="1" height="3" fill="#2dff22"/>
          <rect x="8" y="23" width="4" height="2" fill="#c0c0c0"/>
          <rect x="14" y="23" width="4" height="2" fill="#c0c0c0"/>
          <rect x="20" y="23" width="4" height="2" fill="#c0c0c0"/>
          <path d="M25 20L29 16L27 23L30 22L24 30L26 23L22 25Z" fill="#d79a2b" stroke="#3b2500"/>
        </svg>
      );
    case "monitor":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <rect x="3" y="3" width="26" height="20" fill="#c0c0c0" stroke="#000"/>
          <rect x="5" y="5" width="22" height="16" fill="#000"/>
          <rect x="8" y="8" width="1" height="1" fill="#fff"/>
          <rect x="15" y="6" width="1" height="1" fill="#fff"/>
          <rect x="22" y="10" width="1" height="1" fill="#fff"/>
          <rect x="12" y="14" width="1" height="1" fill="#fff"/>
          <rect x="10" y="11" width="1" height="1" fill="#ffff00"/>
          <rect x="13" y="23" width="6" height="2" fill="#c0c0c0" stroke="#000" strokeWidth="0.5"/>
          <rect x="10" y="25" width="12" height="2" fill="#c0c0c0" stroke="#000" strokeWidth="0.5"/>
        </svg>
      );
    case "settings":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <rect x="4" y="4" width="24" height="24" fill="#c0c0c0" stroke="#000"/>
          <rect x="7" y="8" width="18" height="3" fill="#fff" stroke="#808080" strokeWidth="0.5"/>
          <rect x="14" y="7" width="4" height="5" fill="#c0c0c0" stroke="#000" strokeWidth="0.5"/>
          <rect x="7" y="15" width="18" height="3" fill="#fff" stroke="#808080" strokeWidth="0.5"/>
          <rect x="10" y="14" width="4" height="5" fill="#c0c0c0" stroke="#000" strokeWidth="0.5"/>
          <rect x="7" y="22" width="18" height="3" fill="#fff" stroke="#808080" strokeWidth="0.5"/>
          <rect x="18" y="21" width="4" height="5" fill="#c0c0c0" stroke="#000" strokeWidth="0.5"/>
        </svg>
      );
    case "run":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <rect x="4" y="4" width="24" height="20" fill="#c0c0c0" stroke="#000"/>
          <rect x="5" y="5" width="22" height="4" fill="#000080"/>
          <rect x="5" y="9" width="22" height="14" fill="#fff"/>
          <rect x="7" y="12" width="1" height="8" fill="#000"/>
          <polygon points="20,14 28,18 20,22" fill="#000080"/>
        </svg>
      );
    case "norton":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <rect x="3" y="5" width="26" height="21" fill="#0000aa" stroke="#000"/>
          <rect x="5" y="8" width="10" height="15" fill="#00aaaa" stroke="#fff"/>
          <rect x="17" y="8" width="10" height="15" fill="#00aaaa" stroke="#fff"/>
          <rect x="6" y="10" width="8" height="2" fill="#ffff55"/>
          <rect x="18" y="10" width="8" height="2" fill="#ffff55"/>
          <rect x="6" y="14" width="7" height="1" fill="#fff"/>
          <rect x="18" y="14" width="7" height="1" fill="#fff"/>
          <rect x="3" y="26" width="26" height="3" fill="#00aaaa" stroke="#000"/>
        </svg>
      );
    case "paint":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <rect x="6" y="9" width="16" height="14" fill="#fff" stroke="#000"/>
          <rect x="8" y="11" width="3" height="3" fill="#ff0000"/>
          <rect x="12" y="11" width="3" height="3" fill="#00aa00"/>
          <rect x="16" y="11" width="3" height="3" fill="#0000ff"/>
          <path d="M17 25L25 7L28 9L20 27Z" fill="#7a3b16" stroke="#000"/>
          <path d="M25 7L28 4L30 6L28 9Z" fill="#c0c0c0" stroke="#000"/>
        </svg>
      );
    case "network":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <path d="M4 9H14V18H4V9Z" fill="#d8d8d8" stroke="#000"/>
          <rect x="6" y="11" width="6" height="4" fill="#008080"/>
          <path d="M18 5H28V14H18V5Z" fill="#d8d8d8" stroke="#000"/>
          <rect x="20" y="7" width="6" height="4" fill="#008080"/>
          <path d="M18 20H28V29H18V20Z" fill="#d8d8d8" stroke="#000"/>
          <rect x="20" y="22" width="6" height="4" fill="#008080"/>
          <path d="M14 14H18M23 14V20" stroke="#000"/>
        </svg>
      );
    case "pipes":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <rect x="6" y="5" width="20" height="16" fill="#101010" stroke="#000"/>
          <path d="M9 17V10H15V13H22" stroke="#00ff55" strokeWidth="2"/>
          <path d="M12 19H24V9" stroke="#ffdd33" strokeWidth="2"/>
          <path d="M18 18V14H25" stroke="#ff33aa" strokeWidth="2"/>
          <rect x="11" y="22" width="10" height="3" fill="#c0c0c0" stroke="#000"/>
          <rect x="8" y="25" width="16" height="2" fill="#d8d8d8" stroke="#000"/>
        </svg>
      );
    case "prompt":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <rect x="5" y="6" width="22" height="18" fill="#050505" stroke="#000"/>
          <rect x="7" y="8" width="18" height="14" fill="#101010"/>
          <path d="M9 12L13 15L9 18" stroke="#00ff00" strokeWidth="2"/>
          <rect x="15" y="18" width="7" height="2" fill="#00ff00"/>
          <rect x="11" y="24" width="10" height="3" fill="#c0c0c0" stroke="#000"/>
        </svg>
      );
    case "doom":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <rect x="5" y="6" width="22" height="17" fill="#171717" stroke="#000"/>
          <rect x="7" y="8" width="18" height="11" fill="#5a463a"/>
          <rect x="9" y="9" width="6" height="9" fill="#292929"/>
          <rect x="18" y="10" width="5" height="8" fill="#7c372c"/>
          <path d="M12 24H20L23 29H9Z" fill="#777" stroke="#000"/>
          <rect x="14" y="22" width="4" height="5" fill="#303030"/>
          <path d="M8 20H24" stroke="#ff0000"/>
          <path d="M10 4H22" stroke="#ffff00" strokeWidth="2"/>
        </svg>
      );
    case "calculator":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <rect x="7" y="4" width="18" height="25" fill="#b8d8d8" stroke="#000"/>
          <rect x="10" y="7" width="12" height="5" fill="#eaffff" stroke="#000"/>
          <rect x="10" y="15" width="3" height="2" fill="#fff" stroke="#000" strokeWidth="0.4"/>
          <rect x="14" y="15" width="3" height="2" fill="#fff" stroke="#000" strokeWidth="0.4"/>
          <rect x="18" y="15" width="3" height="2" fill="#fffb98" stroke="#000" strokeWidth="0.4"/>
          <rect x="10" y="18" width="3" height="2" fill="#fff" stroke="#000" strokeWidth="0.4"/>
          <rect x="14" y="18" width="3" height="2" fill="#fff" stroke="#000" strokeWidth="0.4"/>
          <rect x="18" y="18" width="3" height="2" fill="#fffb98" stroke="#000" strokeWidth="0.4"/>
          <rect x="10" y="21" width="3" height="2" fill="#fff" stroke="#000" strokeWidth="0.4"/>
          <rect x="14" y="21" width="3" height="2" fill="#fff" stroke="#000" strokeWidth="0.4"/>
          <rect x="18" y="21" width="3" height="2" fill="#fffb98" stroke="#000" strokeWidth="0.4"/>
        </svg>
      );
    case "ie":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <path d="M8 18C8 10 14 5 21 7C16 8 12 12 12 18C12 23 16 26 21 25C14 28 8 25 8 18Z" fill="#1d63ff" stroke="#003199"/>
          <path d="M6 20C12 14 21 11 27 13" stroke="#80d0ff" strokeWidth="3"/>
          <path d="M5 23C12 20 21 19 27 22" stroke="#1d63ff" strokeWidth="2"/>
        </svg>
      );
    case "mine":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <circle cx="16" cy="17" r="8" fill="#555" stroke="#000"/>
          <circle cx="13" cy="14" r="2" fill="#fff"/>
          <path d="M16 5V9M16 25V29M4 17H8M24 17H28M8 9L11 12M24 9L21 12M8 25L11 22M24 25L21 22" stroke="#000" strokeWidth="2"/>
        </svg>
      );
    case "recorder":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <path d="M5 13H11L19 7V25L11 19H5V13Z" fill="#fff176" stroke="#000"/>
          <path d="M21 10C24 13 24 19 21 22" stroke="#000" strokeWidth="1.5"/>
          <path d="M24 7C29 12 29 20 24 25" stroke="#000" strokeWidth="1"/>
        </svg>
      );
    case "cards":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <rect x="9" y="5" width="13" height="18" fill="#fff" stroke="#000" transform="rotate(8 9 5)"/>
          <rect x="7" y="8" width="13" height="18" fill="#fff" stroke="#000"/>
          <path d="M13 13C11 11 8 13 10 16C11 18 13 19 14 21C15 19 17 18 18 16C20 13 16 11 14 13Z" fill="#cc0000"/>
        </svg>
      );
    case "notepad":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <rect x="7" y="4" width="18" height="24" fill="#f7fff7" stroke="#000"/>
          <rect x="7" y="4" width="18" height="4" fill="#d8d8d8" stroke="#000"/>
          <path d="M10 12H22M10 16H22M10 20H19" stroke="#808080"/>
        </svg>
      );
    case "profile":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <rect x="6" y="2" width="20" height="26" fill="#ffffe0" stroke="#000"/>
          <rect x="6" y="2" width="20" height="4" fill="#000080"/>
          <line x1="9" y1="10" x2="23" y2="10" stroke="#808080"/>
          <line x1="9" y1="13" x2="23" y2="13" stroke="#808080"/>
          <line x1="9" y1="16" x2="23" y2="16" stroke="#808080"/>
          <line x1="9" y1="19" x2="20" y2="19" stroke="#808080"/>
          <circle cx="16" cy="4" r="1.5" fill="#fff"/>
        </svg>
      );
    case "update":
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" style={common}>
          <rect x="6" y="6" width="20" height="15" fill="#d8d8d8" stroke="#000"/>
          <rect x="8" y="8" width="16" height="10" fill="#e9ffff"/>
          <path d="M7 25C11 18 21 18 25 25" stroke="#008000" strokeWidth="4"/>
          <path d="M20 21H27V14" stroke="#0000ff" strokeWidth="3"/>
          <rect x="13" y="21" width="6" height="3" fill="#c0c0c0" stroke="#000"/>
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <rect x="4" y="4" width="24" height="24" fill="#c0c0c0" stroke="#000"/>
          <rect x="5" y="5" width="22" height="4" fill="#000080"/>
          <rect x="6" y="10" width="20" height="16" fill="#fff"/>
          <rect x="8" y="12" width="12" height="2" fill="#000080"/>
          <rect x="8" y="16" width="16" height="1" fill="#808080"/>
          <rect x="8" y="19" width="14" height="1" fill="#808080"/>
        </svg>
      );
  }
}
