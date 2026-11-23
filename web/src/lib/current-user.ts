"use client";

import { useSyncExternalStore } from "react";

// "Logging in" in this course = picking a user on the home page.
// We remember the choice in sessionStorage so every page of THIS browser tab knows who you are.
// (sessionStorage is per tab, so each tab/window can be a different user at the same time.)

export type CurrentUser = { id: number; name: string };

const KEY = "socket-lesson-user";
const listeners = new Set<() => void>();

// Reads the saved user as raw text (a string is easy for React to compare).
function readRaw(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null; // sessionStorage can be blocked; behave as "nobody picked yet"
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function saveCurrentUser(user: CurrentUser | null) {
  try {
    if (user) sessionStorage.setItem(KEY, JSON.stringify(user));
    else sessionStorage.removeItem(KEY);
  } catch {
    // ignore: nothing we can do if storage is blocked
  }
  listeners.forEach((l) => l());
}

// React hook: `const user = useCurrentUser()` -> { id, name } or null.
export function useCurrentUser(): CurrentUser | null {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null; // a corrupted saved value counts as "nobody picked yet"
  }
}
