export type UserId = "mom" | "son";

export type User = {
  id: UserId;
  name: string;
  color: string;
  emoji: string;
};

export type Shift = {
  id: string;
  userId: UserId;
  date: string;
  patternCode?: string;
  startTime?: string;
  endTime?: string;
  note?: string;
};

export type ShiftPattern = {
  code: string;
  label: string;
  shortLabel?: string;
  startTime?: string;
  endTime?: string;
  isLeave?: boolean;
  userId?: UserId;
};

export const SHIFT_PATTERNS: ShiftPattern[] = [
  { code: "E", label: "早番 勤務", startTime: "10:00", endTime: "16:30", userId: "mom" },
  { code: "A", label: "早番A 勤務", startTime: "10:00", endTime: "17:30", userId: "mom" },
  { code: "F", label: "中番 勤務", startTime: "15:30", endTime: "23:30", userId: "mom" },
  { code: "B", label: "遅番 勤務", startTime: "17:00", endTime: "23:30", userId: "mom" },
  { code: "E休", label: "早番 有給", startTime: "10:00", endTime: "16:30", isLeave: true, userId: "mom" },
  { code: "物", label: "夜→物流", shortLabel: "物流", userId: "son" },
  { code: "C", label: "夜→コールセンター", shortLabel: "CS", userId: "son" },
  { code: "リ", label: "リモート", shortLabel: "リモ", userId: "son" },
];

export function findPattern(code?: string): ShiftPattern | undefined {
  if (!code) return undefined;
  return SHIFT_PATTERNS.find((p) => p.code === code);
}

export function getPatternsForUser(userId: UserId): ShiftPattern[] {
  return SHIFT_PATTERNS.filter((p) => !p.userId || p.userId === userId);
}

export function describeShift(shift: Pick<Shift, "patternCode" | "startTime" | "endTime" | "note">): string {
  const p = findPattern(shift.patternCode);
  if (p) {
    if (p.isLeave) return `${p.code}（${p.label}）`;
    if (p.startTime && p.endTime) return `${p.code}  ${p.startTime}〜${p.endTime}`;
    return p.label;
  }
  if (shift.startTime && shift.endTime) return `${shift.startTime}〜${shift.endTime}`;
  return shift.note ?? "時間未定";
}

export type Plan = {
  id: string;
  userId: UserId;
  date: string;
  title: string;
  startTime?: string;
  endTime?: string;
};

export type Memo = {
  id: string;
  userId: UserId;
  text: string;
  done: boolean;
  createdAt: string;
};

export const USERS: Record<UserId, User> = {
  mom: { id: "mom", name: "由美", color: "#c2410c", emoji: "👩" },
  son: { id: "son", name: "憲", color: "#1d4ed8", emoji: "🧑" },
};
