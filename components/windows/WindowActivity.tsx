"use client";

import { createContext, useContext } from "react";
import { useDocumentVisible } from "@/hooks/useDocumentVisible";

export const WindowActivity = createContext({ active: true, visible: true });

export function useWindowActivity() {
  const activity = useContext(WindowActivity);
  const documentVisible = useDocumentVisible();
  return { active: activity.active && documentVisible, visible: activity.visible && documentVisible };
}
