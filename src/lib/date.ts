import holiday_jp from "@holiday-jp/holiday_jp";

export function isJapaneseHoliday(d: Date): boolean {
  return holiday_jp.isHoliday(d);
}

export function holidayName(d: Date): string | null {
  const key = ymd(d);
  const holidays = holiday_jp.holidays as Record<
    string,
    { name: string } | undefined
  >;
  return holidays[key]?.name ?? null;
}

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

export function reiwaLabel(d: Date): string {
  const year = d.getFullYear();
  const reiwa = year - 2018;
  if (reiwa < 1) return "";
  return reiwa === 1 ? "令和元年" : `令和${reiwa}年`;
}

export function todayFullLabel(d: Date = new Date()): string {
  const r = reiwaLabel(d);
  return `本日: ${r}${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAY_JA[d.getDay()]})`;
}

export function relativeDateLabel(yyyymmdd: string): string {
  const target = parseYmd(yyyymmdd);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );
  const md = `${target.getMonth() + 1}/${target.getDate()}(${
    WEEKDAY_JA[target.getDay()]
  })`;
  if (diff === 0) return `今日 ${md}`;
  if (diff === 1) return `明日 ${md}`;
  if (diff === 2) return `明後日 ${md}`;
  if (diff < 0) return `${-diff}日前 ${md}`;
  return `${diff}日後 ${md}`;
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
