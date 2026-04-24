"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useCurrentUser } from "@/components/UserContext";
import { getMemos, saveMemos, uid } from "@/lib/storage";
import type { Memo } from "@/lib/types";

export default function MemoPage() {
  const user = useCurrentUser();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    setMemos(getMemos());
  }, []);

  const mine = memos.filter((m) => m.userId === user.id);
  const remaining = mine.filter((m) => !m.done);
  const done = mine.filter((m) => m.done);

  const add = () => {
    const v = text.trim();
    if (!v) return;
    const next: Memo[] = [
      ...memos,
      {
        id: uid(),
        userId: user.id,
        text: v,
        done: false,
        createdAt: new Date().toISOString(),
      },
    ];
    setMemos(next);
    saveMemos(next);
    setText("");
  };

  const toggle = (id: string) => {
    const next = memos.map((m) => (m.id === id ? { ...m, done: !m.done } : m));
    setMemos(next);
    saveMemos(next);
  };

  const remove = (id: string) => {
    if (!confirm("このメモを消しますか？")) return;
    const next = memos.filter((m) => m.id !== id);
    setMemos(next);
    saveMemos(next);
  };

  const clearDone = () => {
    if (done.length === 0) return;
    if (!confirm(`完了した${done.length}件を消しますか？`)) return;
    const next = memos.filter((m) => !(m.userId === user.id && m.done));
    setMemos(next);
    saveMemos(next);
  };

  return (
    <>
      <AppHeader title="メモ" user={user} />
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-4">
        <section className="bg-white rounded-2xl border border-border p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="例：牛乳"
              className="flex-1 rounded-xl border-2 border-border px-3 bg-white"
            />
            <button
              onClick={add}
              className="rounded-xl bg-primary text-white px-5 text-base font-bold"
              aria-label="追加"
            >
              ＋追加
            </button>
          </div>
        </section>

        <section>
          <h3 className="font-bold text-base mb-2 px-1">
            のこり（{remaining.length}件）
          </h3>
          {remaining.length === 0 ? (
            <p className="text-muted text-center py-4 bg-white rounded-xl border border-border text-base">
              メモはありません
            </p>
          ) : (
            <ul className="bg-white rounded-2xl border border-border divide-y divide-border overflow-hidden">
              {remaining.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-2 pl-2 pr-2"
                >
                  <button
                    onClick={() => toggle(m.id)}
                    className="w-11 h-11 rounded-full border-2 border-primary flex items-center justify-center shrink-0 compact"
                    aria-label="完了にする"
                  >
                    <span className="sr-only">未完了</span>
                  </button>
                  <span className="flex-1 text-base py-3 break-words">
                    {m.text}
                  </span>
                  <button
                    onClick={() => remove(m.id)}
                    className="w-11 h-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 text-xl font-bold compact"
                    aria-label="削除"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {done.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="font-bold text-base">
                完了（{done.length}件）
              </h3>
              <button
                onClick={clearDone}
                className="text-sm text-red-600 font-semibold compact px-3 py-1"
              >
                まとめて消す
              </button>
            </div>
            <ul className="bg-background rounded-2xl border border-border divide-y divide-border overflow-hidden opacity-75">
              {done.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-2 pl-2 pr-2"
                >
                  <button
                    onClick={() => toggle(m.id)}
                    className="w-11 h-11 rounded-full bg-primary border-2 border-primary flex items-center justify-center text-xl text-white shrink-0 compact"
                    aria-label="戻す"
                  >
                    ✓
                  </button>
                  <span className="flex-1 text-base py-3 line-through break-words">
                    {m.text}
                  </span>
                  <button
                    onClick={() => remove(m.id)}
                    className="w-11 h-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 text-xl font-bold compact"
                    aria-label="削除"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
