"use client";

import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { useCurrentUser } from "@/components/UserContext";
import { clearAll, setCurrentUser } from "@/lib/storage";
import { SHIFT_PATTERNS } from "@/lib/types";

export default function SettingsPage() {
  const user = useCurrentUser();
  const router = useRouter();

  const switchUser = () => {
    setCurrentUser(null);
    router.push("/");
  };

  const resetAll = () => {
    if (
      !confirm(
        "すべての登録データ（シフト・予定・メモ）を消します。\nよろしいですか？"
      )
    )
      return;
    clearAll();
    alert("リセットしました");
    router.push("/");
  };

  return (
    <>
      <AppHeader title="設定" user={user} />
      <main className="flex-1 max-w-md w-full mx-auto px-5 py-5 space-y-4">
        <section className="bg-white rounded-2xl border border-border p-5">
          <h3 className="font-bold text-lg mb-3">いまのユーザー</h3>
          <div className="flex items-center gap-4 p-3 rounded-xl bg-background">
            <span className="text-5xl">{user.emoji}</span>
            <span className="text-xl font-bold" style={{ color: user.color }}>
              {user.name}
            </span>
          </div>
          <button
            onClick={switchUser}
            className="mt-4 w-full rounded-2xl bg-primary text-white text-xl font-bold py-4"
          >
            👥 使う人を切り替える
          </button>
        </section>

        <section className="bg-white rounded-2xl border border-border p-5">
          <h3 className="font-bold text-lg mb-3">シフト種別（由美用）</h3>
          <ul className="divide-y divide-border">
            {SHIFT_PATTERNS.map((p) => (
              <li key={p.code} className="flex items-center gap-3 py-2.5">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold">
                  {p.code}
                </span>
                <div className="flex-1">
                  <div className="font-bold">{p.label}</div>
                  <div className="text-base text-muted">
                    {p.isLeave
                      ? "有給休暇"
                      : `${p.startTime} 〜 ${p.endTime}`}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-2xl border border-border p-5">
          <h3 className="font-bold text-lg mb-3">このアプリについて</h3>
          <dl className="space-y-2 text-base">
            <div className="flex justify-between">
              <dt className="text-muted">バージョン</dt>
              <dd>0.1.0（雛形）</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">データ保存先</dt>
              <dd>端末内（localStorage）</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">OCR</dt>
              <dd>ダミー動作</dd>
            </div>
          </dl>
          <p className="text-sm text-muted mt-3 leading-relaxed">
            ※ これは見た目確認用のひな型です。<br />
            本番版ではSupabaseに保存・Gemini APIで画像読みとりを行います。
          </p>
        </section>

        <section className="bg-white rounded-2xl border-2 border-red-200 p-5">
          <h3 className="font-bold text-lg mb-3 text-red-700">データのリセット</h3>
          <p className="text-base text-muted mb-3">
            動作確認用にすべてのデータを消せます。
          </p>
          <button
            onClick={resetAll}
            className="w-full rounded-2xl bg-red-600 text-white text-lg font-bold py-3"
          >
            🗑 ぜんぶ消す
          </button>
        </section>
      </main>
    </>
  );
}
