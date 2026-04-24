"use client";

import { useEffect, useState } from "react";
import { SHIFT_PATTERNS, findPattern, type Shift } from "@/lib/types";

type Props = {
  shift: Shift;
  ownerLabel: string;
  onSave: (patch: Partial<Shift>) => void;
  onDelete: () => void;
  onClose: () => void;
};

export function ShiftEditSheet({
  shift,
  ownerLabel,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [patternCode, setPatternCode] = useState<string | undefined>(
    shift.patternCode
  );
  const [startTime, setStartTime] = useState(shift.startTime ?? "");
  const [endTime, setEndTime] = useState(shift.endTime ?? "");

  useEffect(() => {
    setPatternCode(shift.patternCode);
    setStartTime(shift.startTime ?? "");
    setEndTime(shift.endTime ?? "");
  }, [shift]);

  const pickPattern = (code: string) => {
    const p = findPattern(code);
    setPatternCode(code);
    if (p && !p.isLeave) {
      setStartTime(p.startTime ?? "");
      setEndTime(p.endTime ?? "");
    } else if (p?.isLeave) {
      setStartTime("");
      setEndTime("");
    }
  };

  const clearPattern = () => setPatternCode(undefined);

  const handleSave = () => {
    const p = findPattern(patternCode);
    onSave({
      patternCode: patternCode ?? undefined,
      startTime: p?.isLeave ? undefined : startTime || undefined,
      endTime: p?.isLeave ? undefined : endTime || undefined,
    });
  };

  const handleDelete = () => {
    if (!confirm("このシフトを消しますか？")) return;
    onDelete();
  };

  const display = shift.date.replaceAll("-", "/");
  const currentPattern = findPattern(patternCode);

  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 flex items-end"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-5 safe-bottom max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-3" />
        <h3 className="text-xl font-bold text-center">{display}</h3>
        <p className="text-center text-muted mb-4">{ownerLabel} のシフト</p>

        <div className="mb-4">
          <div className="font-bold mb-2">シフト種別</div>
          <div className="flex flex-wrap gap-2">
            {SHIFT_PATTERNS.map((sp) => {
              const active = patternCode === sp.code;
              return (
                <button
                  key={sp.code}
                  onClick={() => pickPattern(sp.code)}
                  className={`px-4 py-3 rounded-xl border-2 text-base font-bold ${
                    active
                      ? "bg-primary text-white border-primary"
                      : "bg-white border-border"
                  }`}
                >
                  {sp.code}
                  <span className="ml-1 text-xs font-normal">
                    {sp.isLeave
                      ? "有給"
                      : `${sp.startTime?.slice(0, 5)}-${sp.endTime?.slice(0, 5)}`}
                  </span>
                </button>
              );
            })}
            {patternCode && (
              <button
                onClick={clearPattern}
                className="px-3 py-3 rounded-xl border-2 border-border text-base text-muted"
              >
                解除
              </button>
            )}
          </div>
          {currentPattern && (
            <p className="mt-2 text-base text-muted">
              {currentPattern.label}
              {currentPattern.startTime && !currentPattern.isLeave
                ? `（${currentPattern.startTime}〜${currentPattern.endTime}）`
                : ""}
            </p>
          )}
        </div>

        {!currentPattern?.isLeave && (
          <div className="mb-4">
            <div className="font-bold mb-2">時間（直接編集も可）</div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setPatternCode(undefined);
                }}
                className="flex-1 rounded-lg border border-border px-3 bg-white text-center"
              />
              <span>〜</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setPatternCode(undefined);
                }}
                className="flex-1 rounded-lg border border-border px-3 bg-white text-center"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={handleDelete}
            className="rounded-xl py-3 border-2 border-red-300 text-red-700 text-base font-bold"
          >
            🗑 このシフトを消す
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl py-3 bg-primary text-white text-base font-bold"
          >
            ✓ 保存する
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-2 rounded-xl py-3 border-2 border-border text-base font-bold"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
