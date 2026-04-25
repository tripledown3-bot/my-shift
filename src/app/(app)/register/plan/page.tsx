"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { useCurrentUser } from "@/components/UserContext";
import { todayYmd } from "@/lib/date";
import { addPlan } from "@/lib/db";

const PRESETS = ["犬美容", "私病院", "買い物"];

export default function PlanRegisterPage() {
  const user = useCurrentUser();
  const router = useRouter();
  const [date, setDate] = useState(todayYmd());
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) {
      alert("予定の内容を入れてください");
      return;
    }
    setSaving(true);
    try {
      await addPlan({
        userId: user.id,
        date,
        title: title.trim(),
        startTime: start || undefined,
        endTime: end || undefined,
      });
      alert("予定を登録しました");
      router.push("/calendar");
    } catch (e) {
      alert(e instanceof Error ? e.message : "登録に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppHeader title="予定を登録" user={user} />
      <main className="flex-1 max-w-md w-full mx-auto px-5 py-5 space-y-5">
        <section className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <div>
            <label className="block font-bold text-lg mb-2">日にち</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-border px-3 bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-lg mb-2">内容</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：通院"
              className="w-full rounded-lg border border-border px-3 bg-white"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setTitle(p)}
                  className="px-4 py-2 rounded-full bg-background border border-border text-base"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-lg mb-2">
              時間 <span className="text-muted text-base font-normal">（なくてもOK）</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="flex-1 rounded-lg border border-border px-3 bg-white text-center"
              />
              <span>〜</span>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="flex-1 rounded-lg border border-border px-3 bg-white text-center"
              />
            </div>
          </div>
        </section>

        <button
          onClick={save}
          disabled={saving}
          className="w-full rounded-2xl bg-primary text-white text-xl font-bold py-4 disabled:opacity-60"
        >
          {saving ? "登録中…" : "✓ 登録する"}
        </button>
      </main>
    </>
  );
}
