"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PlanEditSheet } from "@/components/PlanEditSheet";
import { ShiftEditSheet } from "@/components/ShiftEditSheet";
import { useCurrentUser } from "@/components/UserContext";
import {
  WEEKDAY_JA,
  daysInMonthGrid,
  isSameDay,
  monthLabel,
  todayYmd,
  ymd,
} from "@/lib/date";
import {
  getPlans,
  getShifts,
  savePlans,
  saveShifts,
} from "@/lib/storage";
import {
  USERS,
  describeShift,
  findPattern,
  type Plan,
  type Shift,
} from "@/lib/types";

export default function CalendarPage() {
  const user = useCurrentUser();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<string>(todayYmd());
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  useEffect(() => {
    setShifts(getShifts());
    setPlans(getPlans());
  }, []);

  const cells = daysInMonthGrid(cursor.getFullYear(), cursor.getMonth());

  const shiftsByDate = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const s of shifts) {
      const arr = map.get(s.date) ?? [];
      arr.push(s);
      map.set(s.date, arr);
    }
    return map;
  }, [shifts]);

  const plansByDate = useMemo(() => {
    const map = new Map<string, Plan[]>();
    for (const p of plans) {
      if (p.userId !== user.id) continue;
      const arr = map.get(p.date) ?? [];
      arr.push(p);
      map.set(p.date, arr);
    }
    return map;
  }, [plans, user.id]);

  const selectedShifts = shiftsByDate.get(selected) ?? [];
  const selectedPlans = plansByDate.get(selected) ?? [];

  const prev = () =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const next = () =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));

  const updateShift = (id: string, patch: Partial<Shift>) => {
    const next = shifts.map((s) => (s.id === id ? { ...s, ...patch } : s));
    setShifts(next);
    saveShifts(next);
  };

  const deleteShift = (id: string) => {
    const next = shifts.filter((s) => s.id !== id);
    setShifts(next);
    saveShifts(next);
  };

  const updatePlan = (id: string, patch: Partial<Plan>) => {
    const next = plans.map((p) => (p.id === id ? { ...p, ...patch } : p));
    setPlans(next);
    savePlans(next);
  };

  const deletePlan = (id: string) => {
    const next = plans.filter((p) => p.id !== id);
    setPlans(next);
    savePlans(next);
  };

  return (
    <>
      <AppHeader title="カレンダー" user={user} />
      <main className="flex-1 max-w-md w-full mx-auto px-3 py-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            onClick={prev}
            className="px-4 py-2 rounded-full bg-white border-2 border-border text-xl font-bold"
            aria-label="前の月"
          >
            ←
          </button>
          <h2 className="text-xl font-bold">{monthLabel(cursor)}</h2>
          <button
            onClick={next}
            className="px-4 py-2 rounded-full bg-white border-2 border-border text-xl font-bold"
            aria-label="次の月"
          >
            →
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-7 bg-primary/10">
            {WEEKDAY_JA.map((w, i) => (
              <div
                key={w}
                className={`text-center py-2.5 text-lg font-bold ${
                  i === 0 ? "text-red-600" : i === 6 ? "text-blue-600" : ""
                }`}
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              const key = ymd(d);
              const inMonth = d.getMonth() === cursor.getMonth();
              const isToday = isSameDay(d, today);
              const isSelected = key === selected;
              const dayShifts = shiftsByDate.get(key) ?? [];
              const dayPlans = plansByDate.get(key) ?? [];
              const weekday = d.getDay();

              return (
                <button
                  key={i}
                  onClick={() => setSelected(key)}
                  className={`min-h-[88px] border-b border-r border-border last:border-r-0 text-left p-1.5 flex flex-col transition ${
                    inMonth ? "bg-white" : "bg-background/40"
                  } ${isSelected ? "ring-4 ring-primary ring-inset" : ""}`}
                >
                  <span
                    className={`text-lg font-bold leading-none ${
                      isToday
                        ? "bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center"
                        : weekday === 0
                        ? "text-red-600"
                        : weekday === 6
                        ? "text-blue-600"
                        : ""
                    } ${!inMonth ? "opacity-40" : ""}`}
                  >
                    {d.getDate()}
                  </span>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    {dayShifts.slice(0, 2).map((s) => {
                      const p = findPattern(s.patternCode);
                      const short = p
                        ? p.code
                        : s.startTime?.slice(0, 5) ?? "";
                      return (
                        <span
                          key={s.id}
                          className="text-xs leading-tight rounded px-1 py-0.5 text-white font-bold truncate"
                          style={{ backgroundColor: USERS[s.userId].color }}
                        >
                          {USERS[s.userId].emoji}
                          {short}
                        </span>
                      );
                    })}
                    {dayPlans.length > 0 && (
                      <span className="text-xs leading-tight rounded px-1 py-0.5 bg-accent/20 text-accent font-bold truncate">
                        ★{dayPlans[0].title}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <section className="mt-5 bg-white rounded-2xl border border-border p-4">
          <h3 className="text-lg font-bold mb-3">
            {selected.replaceAll("-", "/")} の予定
          </h3>
          {selectedShifts.length === 0 && selectedPlans.length === 0 ? (
            <p className="text-muted text-base py-4 text-center">
              予定はありません
            </p>
          ) : (
            <ul className="space-y-3">
              {selectedShifts.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setEditingShift(s)}
                    className="w-full text-left flex items-center gap-3 rounded-xl p-3 border-l-8 hover:shadow-sm active:scale-[0.99] transition"
                    style={{
                      borderLeftColor: USERS[s.userId].color,
                      backgroundColor: `${USERS[s.userId].color}10`,
                    }}
                  >
                    <span className="text-3xl">{USERS[s.userId].emoji}</span>
                    <div className="flex-1">
                      <div className="font-bold text-lg">
                        {USERS[s.userId].name}のシフト
                      </div>
                      <div className="text-base text-muted">
                        {describeShift(s)}
                      </div>
                    </div>
                    <span className="text-muted text-xl">✎</span>
                  </button>
                </li>
              ))}
              {selectedPlans.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setEditingPlan(p)}
                    className="w-full text-left flex items-center gap-3 rounded-xl p-3 bg-accent/10 border-l-8 border-accent hover:shadow-sm active:scale-[0.99] transition"
                  >
                    <span className="text-3xl">⭐</span>
                    <div className="flex-1">
                      <div className="font-bold text-lg">{p.title}</div>
                      <div className="text-base text-muted">
                        {p.startTime
                          ? `${p.startTime}${p.endTime ? ` 〜 ${p.endTime}` : ""}`
                          : "時間未定"}
                      </div>
                    </div>
                    <span className="text-muted text-xl">✎</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-sm text-muted text-center">
            ✎ タップで修正・削除できます
          </p>
        </section>
      </main>

      {editingShift && (
        <ShiftEditSheet
          shift={editingShift}
          ownerLabel={USERS[editingShift.userId].name}
          onSave={(patch) => {
            updateShift(editingShift.id, patch);
            setEditingShift(null);
          }}
          onDelete={() => {
            deleteShift(editingShift.id);
            setEditingShift(null);
          }}
          onClose={() => setEditingShift(null)}
        />
      )}

      {editingPlan && (
        <PlanEditSheet
          plan={editingPlan}
          onSave={(patch) => {
            updatePlan(editingPlan.id, patch);
            setEditingPlan(null);
          }}
          onDelete={() => {
            deletePlan(editingPlan.id);
            setEditingPlan(null);
          }}
          onClose={() => setEditingPlan(null)}
        />
      )}
    </>
  );
}
