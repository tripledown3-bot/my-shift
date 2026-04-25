"use client";

import type { UserId } from "./types";

const KEY_CURRENT_USER = "my-shift:currentUser";

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function getCurrentUser(): UserId | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(KEY_CURRENT_USER);
    return raw ? (JSON.parse(raw) as UserId) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(userId: UserId | null): void {
  if (!isClient()) return;
  if (userId === null) {
    localStorage.removeItem(KEY_CURRENT_USER);
    return;
  }
  localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(userId));
}
