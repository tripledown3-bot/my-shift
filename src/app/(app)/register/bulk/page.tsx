"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { useCurrentUser } from "@/components/UserContext";
import {
  WEEKDAY_JA,
  daysInMonthGrid,
  monthLabel,
  ymd,
} from "@/lib/date";
import { addShifts } from "@/lib/db";
import { SHIFT_PATTERNS, getPatternsForUser } from "@/lib/types";

export default function BulkRegisterPage() {
  const user = useCurrentUser();
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [patternCode, setPatternCode] = useState<string | null>(null);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");

  const cells = daysInMonthGrid(cursor.getFullYear(), cursor.getMonth());

  const choosePattern = (code: string) => {
    const p = SHIFT_PATTERNS.find((x) => x.code === code);
    if (!p) return;
    setPatternCode(code);
    if (p.startTime && p.endTime) {
      setStart(p.startTime);
      setEnd(p.endTime);
    }
  };

  const clearPattern = () => setPatternCode(null);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (selected.size === 0) return;
    const p = SHIFT_PATTERNS.find((x) => x.code === patternCode);
    const adds = Array.from(selected).map((date) => ({
      userId: user.id,
      date,
      patternCode: patternCode ?? undefined,
      startTime: p?.isLeave ? undefined : start,
      endTime: p?.isLeave ? undefined : end,
    }));
    setSaving(true);
    try {
      await addShifts(adds);
      alert(`${adds.length}件のシフトを登録しました`);
      router.push("/calendar");
    } catch (e) {
      alert(e instanceof Error ? e.message : "登録に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppHeader title="まとめて登録" user={user} />
      <main className="flex-1 max-w-md w-full mx-auto px-3 py-4 space-y-4">
        <section className="bg-white rounded-2xl border border-border p-4">
          <h3 className="font-bold text-lg mb-2">① シフト種別（任意）</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {getPatternsForUser(user.id).map((sp) => {
              const active = patternCode === sp.code;
              return (
                <button
                  key={sp.code}
                  onClick={() => choosePattern(sp.code)}
                  className={`px-4 py-2 rounded-xl border-2 text-base font-bold ${
                    active
                      ? "bg-primary text-white border-primary"
                      : "bg-white border-border"
                  }`}
                  style={
                    active
                      ? {}
                      : { color: user.color, borderColor: user.color }
                  }
                >
                  {sp.code}
                  <span className="ml-1 text-xs font-normal">
                    {sp.isLeave
                      ? "有給"
                      : sp.startTime && sp.endTime
                      ? `${sp.startTime.slice(0, 5)}-${sp.endTime.slice(0, 5)}`
                      : sp.label.replace(`${sp.code}`, "").trim() || ""}
                  </span>
                </button>
              );
            })}
            {patternCode && (
              <button
                onClick={clearPattern}
                className="px-3 py-2 rounded-xl border-2 border-border text-base text-muted"
              >
                解除
              </button>
            )}
          </div>

          <h3 className="font-bold text-lg mb-2">② 時間</h3>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                setPatternCode(null);
              }}
              className="flex-1 rounded-lg border border-border px-3 bg-white text-center"
            />
            <span>〜</span>
            <input
              type="time"
              value={end}
              onChange={(e) => {
                setEnd(e.target.value);
                setPatternCode(null);
              }}
              className="flex-1 rounded-lg border border-border px-3 bg-white text-center"
            />
          </div>
          <p className="text-sm text-muted mt-2">
            種別を選ぶと時間が自動で入ります。直接入力も可。
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-border p-3">
          <h3 className="font-bold text-lg mb-2 px-1">
            ③ 日にちを選ぶ（複数可）
          </h3>
          <div className="flex items-center justify-between mb-2 px-1">
            <button
              onClick={() =>
                setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
              }
              className="px-3 py-1.5 rounded-full bg-background border border-border text-lg"
            >
              ←
            </button>
            <span className="text-lg font-bold">{monthLabel(cursor)}</span>
            <button
              onClick={() =>
                setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
              }
              className="px-3 py-1.5 rounded-full bg-background border border-border text-lg"
            >
              →
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAY_JA.map((w, i) => (
              <div
                key={w}
                className={`text-center py-1 text-sm font-bold ${
                  i === 0 ? "text-red-600" : i === 6 ? "text-blue-600" : ""
                }`}
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              const key = ymd(d);
              const inMonth = d.getMonth() === cursor.getMonth();
              const isSelected = selected.has(key);
              return (
                <button
                  key={i}
                  onClick={() => toggle(key)}
                  className={`aspect-square rounded-xl text-lg font-bold transition border-2 ${
                    isSelected
                      ? "bg-primary text-white border-primary"
                      : inMonth
                      ? "bg-white border-border"
                      : "bg-background/40 border-transparent text-muted"
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </section>

        <div className="h-24" aria-hidden />
      </main>

      <div className="fixed bottom-[68px] inset-x-0 z-10 px-3">
        <div className="max-w-md mx-auto">
          <button
            onClick={save}
            disabled={selected.size === 0 || saving}
            className="w-full rounded-2xl bg-primary text-white text-xl font-bold py-4 shadow-lg disabled:opacity-50 disabled:bg-muted"
          >
            {saving
              ? "登録中…"
              : selected.size === 0
              ? "日にちを選んでください"
              : `✓ ${selected.size}日分を登録する${
                  patternCode ? `（${patternCode}）` : ""
                }`}
          </button>
        </div>
      </div>
    </>
  );
}
