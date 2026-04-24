export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function monthLabel(d: Date): string {
  return `${d.getFullYear()}年 ${d.getMonth() + 1}月`;
}

export function daysInMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const firstWeekday = first.getDay();
  const start = new Date(year, month, 1 - firstWeekday);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

export const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function todayYmd(): string {
  return ymd(new Date());
}
