"use client";

import { useSyncExternalStore } from "react";

// "Logging in" in this course = picking a user on the home page.
// We remember the choice in localStorage so every page knows who you are.

export type CurrentUser = { id: number; name: string };

const KEY = "socket-lesson-user";
const listeners = new Set<() => void>();

// Reads the saved user as raw text (a string is easy for React to compare).
function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null; // localStorage can be blocked; behave as "nobody picked yet"
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange); // other tabs changed it
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function saveCurrentUser(user: CurrentUser | null) {
  try {
    if (user) localStorage.setItem(KEY, JSON.stringify(user));
    else localStorage.removeItem(KEY);
  } catch {
    // ignore: nothing we can do if storage is blocked
  }
  listeners.forEach((l) => l());
}

// React hook: `const user = useCurrentUser()` -> { id, name } or null.
export function useCurrentUser(): CurrentUser | null {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return raw ? (JSON.parse(raw) as CurrentUser) : null;
}
