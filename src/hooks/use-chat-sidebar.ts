"use client";

import { useLayoutEffect, useCallback, useState } from "react";

const STORAGE_KEY = "chat-sidebar-expanded";
const DESKTOP_QUERY = "(min-width: 768px)";

function readStoredExpanded(fallback: boolean): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === "true";
  } catch {
    // ignore — private browsing
  }
  return fallback;
}

function saveExpanded(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // ignore
  }
}

export function useChatSidebar() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);

    function syncFromMedia() {
      const desktop = mq.matches;
      setIsDesktop(desktop);
      setExpanded(readStoredExpanded(desktop));
      setHydrated(true);
    }

    const frame = requestAnimationFrame(syncFromMedia);

    function onChange(e: MediaQueryListEvent) {
      setIsDesktop(e.matches);
    }

    mq.addEventListener("change", onChange);
    return () => {
      cancelAnimationFrame(frame);
      mq.removeEventListener("change", onChange);
    };
  }, []);

  const open = useCallback(() => {
    setExpanded(true);
    saveExpanded(true);
  }, []);

  const close = useCallback(() => {
    setExpanded(false);
    saveExpanded(false);
  }, []);

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      saveExpanded(next);
      return next;
    });
  }, []);

  return { isDesktop, isOpen: expanded, hydrated, open, close, toggle };
}
