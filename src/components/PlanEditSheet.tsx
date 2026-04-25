"use client";

import { useEffect, useState } from "react";
import type { Plan } from "@/lib/types";

const PRESETS_BY_USER: Record<"mom" | "son", string[]> = {
  mom: ["犬美容", "私病院", "買い物"],
  son: ["餌", "買い物"],
};

type Props = {
  plan: Plan;
  onSave: (patch: Partial<Plan>) => void;
  onDelete: () => void;
  onClose: () => void;
};

export function PlanEditSheet({ plan, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(plan.title);
  const [startTime, setStartTime] = useState(plan.startTime ?? "");
  const [endTime, setEndTime] = useState(plan.endTime ?? "");

  useEffect(() => {
    setTitle(plan.title);
    setStartTime(plan.startTime ?? "");
    setEndTime(plan.endTime ?? "");
  }, [plan]);

  const handleSave = () => {
    if (!title.trim()) {
      alert("内容を入れてください");
      return;
    }
    onSave({
      title: title.trim(),
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    });
  };

  const handleDelete = () => {
    if (!confirm("この予定を消しますか？")) return;
    onDelete();
  };

  const display = plan.date.replaceAll("-", "/");

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
        <h3 className="text-xl font-bold text-center mb-4">{display} の予定</h3>

        <div className="mb-4">
          <label className="block font-bold mb-2">内容</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border px-3 bg-white"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {PRESETS_BY_USER[plan.userId].map((p) => (
              <button
                key={p}
                onClick={() => setTitle(p)}
                className="px-3 py-2 rounded-full bg-background border border-border text-base"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-bold mb-2">
            時間 <span className="text-muted text-sm font-normal">（なくてもOK）</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex-1 rounded-lg border border-border px-3 bg-white text-center"
            />
            <span>〜</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="flex-1 rounded-lg border border-border px-3 bg-white text-center"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={handleDelete}
            className="rounded-xl py-3 border-2 border-red-300 text-red-700 text-base font-bold"
          >
            🗑 この予定を消す
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
