"use client";

import { useEffect, useSyncExternalStore } from "react";

// Lessons 1-9 have no login. Every browser tab just gets a nickname (Tab-4F2K) so you
// can tell the tabs apart in the log. It is remembered per tab (sessionStorage).
const KEY = "socket-lesson-nickname";
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function saveNickname(name: string) {
  try {
    sessionStorage.setItem(KEY, name);
  } catch {
    // storage blocked: the nickname just will not be remembered
  }
  listeners.forEach((l) => l());
}

function makeDefault() {
  saveNickname("Tab-" + Math.random().toString(36).slice(2, 6).toUpperCase());
}

// `const [nickname, setNickname] = useNickname()`  ("" during the first server render)
export function useNickname(): [string, (name: string) => void] {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  // First visit in this tab: create the default once the page is on screen.
  useEffect(() => {
    if (readRaw() === null) makeDefault();
  }, []);
  return [raw ?? "", saveNickname];
}
