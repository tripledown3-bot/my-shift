"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  deletePlan as dbDeletePlan,
  deleteShift as dbDeleteShift,
  fetchPlans,
  fetchShifts,
  updatePlan as dbUpdatePlan,
  updateShift as dbUpdateShift,
} from "@/lib/db";
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
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const detailsRef = useRef<HTMLElement | null>(null);

  const reload = async () => {
    try {
      const [s, p] = await Promise.all([fetchShifts(), fetchPlans(user.id)]);
      setShifts(s);
      setPlans(p);
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg(
        e instanceof Error ? e.message : "データ取得に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const selectDate = (key: string) => {
    setSelected(key);
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

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

  const updateShift = async (id: string, patch: Partial<Shift>) => {
    setShifts((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    try {
      await dbUpdateShift(id, patch);
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新に失敗しました");
      await reload();
    }
  };

  const deleteShift = async (id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
    try {
      await dbDeleteShift(id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "削除に失敗しました");
      await reload();
    }
  };

  const updatePlan = async (id: string, patch: Partial<Plan>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    try {
      await dbUpdatePlan(id, patch);
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新に失敗しました");
      await reload();
    }
  };

  const deletePlan = async (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    try {
      await dbDeletePlan(id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "削除に失敗しました");
      await reload();
    }
  };

  return (
    <>
      <AppHeader title="カレンダー" user={user} />
      <main className="flex-1 max-w-md w-full mx-auto px-3 py-4">
        {loading && (
          <p className="text-center text-muted py-2">読み込み中…</p>
        )}
        {errorMsg && (
          <p className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-3">
            ⚠ {errorMsg}
          </p>
        )}
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
                  onClick={() => selectDate(key)}
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
                  <div className="flex flex-col gap-0.5 mt-1">
                    {dayShifts.slice(0, 2).map((s) => {
                      const p = findPattern(s.patternCode);
                      const short = p
                        ? p.code
                        : s.startTime?.slice(0, 5) ?? "";
                      return (
                        <span
                          key={s.id}
                          className="text-sm leading-tight rounded px-1 py-0.5 text-white font-bold text-center truncate"
                          style={{ backgroundColor: USERS[s.userId].color }}
                        >
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

        <section
          ref={detailsRef}
          className="mt-5 bg-white rounded-2xl border-2 border-primary/20 p-4 scroll-mt-24"
        >
          <h3 className="text-xl font-bold mb-3 text-primary">
            📌 {selected.replaceAll("-", "/")} の予定
          </h3>
          {selectedShifts.length === 0 && selectedPlans.length === 0 ? (
            <p className="text-muted text-base py-4 text-center">
              予定はありません
            </p>
          ) : (
            <ul className="space-y-2">
              {selectedShifts.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setEditingShift(s)}
                    className="w-full text-left flex items-center gap-2 rounded-xl py-2 px-3 border-l-4 active:scale-[0.99] transition"
                    style={{
                      borderLeftColor: USERS[s.userId].color,
                      backgroundColor: `${USERS[s.userId].color}10`,
                    }}
                  >
                    <span
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: USERS[s.userId].color }}
                    >
                      {USERS[s.userId].name.slice(0, 1)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base truncate">
                        {USERS[s.userId].name}のシフト
                      </div>
                      <div className="text-sm text-muted truncate">
                        {describeShift(s)}
                      </div>
                    </div>
                    <span className="text-muted text-base font-bold px-2">✎</span>
                  </button>
                </li>
              ))}
              {selectedPlans.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setEditingPlan(p)}
                    className="w-full text-left flex items-center gap-2 rounded-xl py-2 px-3 bg-accent/10 border-l-4 border-accent active:scale-[0.99] transition"
                  >
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/20 text-accent text-xl shrink-0">
                      ⭐
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base truncate">{p.title}</div>
                      <div className="text-sm text-muted truncate">
                        {p.startTime
                          ? `${p.startTime}${p.endTime ? ` 〜 ${p.endTime}` : ""}`
                          : "時間未定"}
                      </div>
                    </div>
                    <span className="text-muted text-base font-bold px-2">✎</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {(selectedShifts.length > 0 || selectedPlans.length > 0) && (
            <p className="mt-3 text-sm text-muted text-center">
              ✎ タップで修正・削除できます
            </p>
          )}
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
