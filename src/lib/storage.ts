"use client";

import type { Memo, Plan, Shift, UserId } from "./types";

const KEYS = {
  currentUser: "my-shift:currentUser",
  shifts: "my-shift:shifts",
  plans: "my-shift:plans",
  memos: "my-shift:memos",
  seeded: "my-shift:seeded",
} as const;

function isClient(): boolean {
  return typeof window !== "undefined";
}

function read<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (!isClient()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getCurrentUser(): UserId | null {
  return read<UserId | null>(KEYS.currentUser, null);
}

export function setCurrentUser(userId: UserId | null): void {
  if (userId === null) {
    if (isClient()) localStorage.removeItem(KEYS.currentUser);
    return;
  }
  write(KEYS.currentUser, userId);
}

export function getShifts(): Shift[] {
  return read<Shift[]>(KEYS.shifts, []);
}
export function saveShifts(shifts: Shift[]): void {
  write(KEYS.shifts, shifts);
}

export function getPlans(): Plan[] {
  return read<Plan[]>(KEYS.plans, []);
}
export function savePlans(plans: Plan[]): void {
  write(KEYS.plans, plans);
}

export function getMemos(): Memo[] {
  return read<Memo[]>(KEYS.memos, []);
}
export function saveMemos(memos: Memo[]): void {
  write(KEYS.memos, memos);
}

export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function seedIfEmpty(): void {
  if (!isClient()) return;
  if (localStorage.getItem(KEYS.seeded) === "1") return;

  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const ymd = (d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const shifts: Shift[] = [
    { id: uid(), userId: "mom", date: ymd(3), patternCode: "E" },
    { id: uid(), userId: "mom", date: ymd(5), patternCode: "A" },
    { id: uid(), userId: "mom", date: ymd(10), patternCode: "F" },
    { id: uid(), userId: "mom", date: ymd(17), patternCode: "E" },
    { id: uid(), userId: "son", date: ymd(4), startTime: "10:00", endTime: "19:00" },
    { id: uid(), userId: "son", date: ymd(5), startTime: "10:00", endTime: "19:00" },
    { id: uid(), userId: "son", date: ymd(11), startTime: "10:00", endTime: "19:00" },
    { id: uid(), userId: "son", date: ymd(12), startTime: "10:00", endTime: "19:00" },
    { id: uid(), userId: "son", date: ymd(18), startTime: "10:00", endTime: "19:00" },
  ];

  const plans: Plan[] = [
    { id: uid(), userId: "mom", date: ymd(8), title: "私病院", startTime: "14:00" },
    { id: uid(), userId: "mom", date: ymd(15), title: "犬美容" },
    { id: uid(), userId: "son", date: ymd(20), title: "買い物" },
  ];

  const memos: Memo[] = [
    { id: uid(), userId: "mom", text: "牛乳", done: false, createdAt: new Date().toISOString() },
    { id: uid(), userId: "mom", text: "食パン", done: false, createdAt: new Date().toISOString() },
    { id: uid(), userId: "mom", text: "電池（単3）", done: true, createdAt: new Date().toISOString() },
    { id: uid(), userId: "son", text: "シャンプー", done: false, createdAt: new Date().toISOString() },
  ];

  saveShifts(shifts);
  savePlans(plans);
  saveMemos(memos);
  localStorage.setItem(KEYS.seeded, "1");
}

export function clearAll(): void {
  if (!isClient()) return;
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}
