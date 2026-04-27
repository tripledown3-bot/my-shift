"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useCurrentUser } from "@/components/UserContext";
import {
  addMemo,
  deleteDoneMemos,
  deleteMemo,
  fetchMemos,
  updateMemo,
} from "@/lib/db";
import type { Memo } from "@/lib/types";

export default function MemoPage() {
  const user = useCurrentUser();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const reload = async () => {
    try {
      const data = await fetchMemos(user.id);
      setMemos(data);
      setErrorMsg(null);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const remaining = memos.filter((m) => !m.done);
  const done = memos.filter((m) => m.done);

  const add = async () => {
    const v = text.trim();
    if (!v) return;
    setText("");
    try {
      const created = await addMemo({
        userId: user.id,
        text: v,
        done: false,
      });
      setMemos((prev) => [...prev, created]);
    } catch (e) {
      alert(e instanceof Error ? e.message : "追加に失敗しました");
      setText(v);
    }
  };

  const toggle = async (id: string) => {
    const target = memos.find((m) => m.id === id);
    if (!target) return;
    const newDone = !target.done;
    setMemos((prev) =>
      prev.map((m) => (m.id === id ? { ...m, done: newDone } : m))
    );
    try {
      await updateMemo(id, { done: newDone });
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新に失敗しました");
      await reload();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("このメモを消しますか？")) return;
    setMemos((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteMemo(id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "削除に失敗しました");
      await reload();
    }
  };

  const startEdit = (m: Memo) => {
    setEditingId(m.id);
    setEditingText(m.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = async (id: string) => {
    const v = editingText.trim();
    if (!v) {
      cancelEdit();
      return;
    }
    setMemos((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text: v } : m))
    );
    setEditingId(null);
    setEditingText("");
    try {
      await updateMemo(id, { text: v });
    } catch (e) {
      alert(e instanceof Error ? e.message : "更新に失敗しました");
      await reload();
    }
  };

  const clearDone = async () => {
    if (done.length === 0) return;
    if (!confirm(`完了した${done.length}件を消しますか？`)) return;
    setMemos((prev) => prev.filter((m) => !m.done));
    try {
      await deleteDoneMemos(user.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "削除に失敗しました");
      await reload();
    }
  };

  return (
    <>
      <AppHeader title="メモ" user={user} />
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-4">
        {errorMsg && (
          <p className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3">
            ⚠ {errorMsg}
          </p>
        )}
        <section className="bg-primary/5 rounded-2xl border border-primary/20 p-3 text-base">
          <p className="font-bold text-primary mb-1">📝 メモの使い方</p>
          <p className="text-sm text-muted leading-relaxed">
            <span className="font-semibold">買い物リスト</span>や、
            <span className="font-semibold">ちょっとしたやる事（タスク）</span>の管理に使えます。
            <br />
            例：牛乳・薬を飲む・電球を買う など
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-border p-3">
          <div className="flex items-stretch gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="例：牛乳"
              className="flex-1 min-w-0 rounded-xl border-2 border-border px-3 bg-white"
            />
            <button
              onClick={add}
              className="rounded-xl bg-primary text-white px-4 text-base font-bold shrink-0 whitespace-nowrap"
              style={{ minHeight: 56 }}
              aria-label="追加"
            >
              ＋追加
            </button>
          </div>
        </section>

        {loading ? (
          <p className="text-center text-muted py-6">読み込み中…</p>
        ) : (
          <>
            <section>
              <h3 className="font-bold text-base mb-1 px-1">
                のこり（{remaining.length}件）
              </h3>
              <p className="text-xs text-muted mb-2 px-1">
                文字をタップで編集　◯で完了　✕で削除
              </p>
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
                      {editingId === m.id ? (
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={() => saveEdit(m.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(m.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          autoFocus
                          className="flex-1 text-base py-2 px-2 rounded-lg border-2 border-primary bg-white"
                          style={{ minHeight: 0 }}
                        />
                      ) : (
                        <button
                          onClick={() => startEdit(m)}
                          className="flex-1 text-base py-3 text-left break-words compact"
                          style={{ minHeight: 0 }}
                          aria-label="編集"
                        >
                          {m.text}
                        </button>
                      )}
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
                      {editingId === m.id ? (
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={() => saveEdit(m.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(m.id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          autoFocus
                          className="flex-1 text-base py-2 px-2 rounded-lg border-2 border-primary bg-white"
                          style={{ minHeight: 0 }}
                        />
                      ) : (
                        <button
                          onClick={() => startEdit(m)}
                          className="flex-1 text-base py-3 text-left line-through break-words compact"
                          style={{ minHeight: 0 }}
                          aria-label="編集"
                        >
                          {m.text}
                        </button>
                      )}
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
          </>
        )}
      </main>
    </>
  );
}
