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
      <AppHeader title="メモ・買い物リスト" user={user} />
      <main className="flex-1 max-w-md w-full mx-auto px-5 py-5 space-y-5">
        <section className="bg-white rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="例：牛乳"
              className="flex-1 rounded-xl border-2 border-border px-4 bg-white"
            />
            <button
              onClick={add}
              className="rounded-xl bg-primary text-white px-6 text-lg font-bold"
              aria-label="追加"
            >
              ＋追加
            </button>
          </div>
        </section>

        <section>
          <h3 className="font-bold text-lg mb-2 px-1">
            のこり（{remaining.length}件）
          </h3>
          {remaining.length === 0 ? (
            <p className="text-muted text-center py-6 bg-white rounded-2xl border border-border">
              メモはありません
            </p>
          ) : (
            <ul className="space-y-2">
              {remaining.map((m) => (
                <li
                  key={m.id}
                  className="bg-white rounded-2xl border border-border px-3 py-2 flex items-center gap-3"
                >
                  <button
                    onClick={() => toggle(m.id)}
                    className="w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center text-2xl shrink-0"
                    aria-label="完了にする"
                  >
                    {" "}
                  </button>
                  <span className="flex-1 text-lg">{m.text}</span>
                  <button
                    onClick={() => remove(m.id)}
                    className="text-red-600 text-base font-bold px-3 py-2 border-2 border-red-200 rounded-lg"
                    aria-label="削除"
                  >
                    消す
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {done.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="font-bold text-lg">
                完了（{done.length}件）
              </h3>
              <button
                onClick={clearDone}
                className="text-base text-red-600 font-semibold"
              >
                まとめて消す
              </button>
            </div>
            <ul className="space-y-2">
              {done.map((m) => (
                <li
                  key={m.id}
                  className="bg-background rounded-2xl border border-border px-3 py-2 flex items-center gap-3 opacity-70"
                >
                  <button
                    onClick={() => toggle(m.id)}
                    className="w-12 h-12 rounded-full bg-primary border-2 border-primary flex items-center justify-center text-2xl text-white shrink-0"
                    aria-label="戻す"
                  >
                    ✓
                  </button>
                  <span className="flex-1 text-lg line-through">{m.text}</span>
                  <button
                    onClick={() => remove(m.id)}
                    className="text-red-600 text-base font-bold px-3 py-2 border-2 border-red-200 rounded-lg"
                    aria-label="削除"
                  >
                    消す
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
