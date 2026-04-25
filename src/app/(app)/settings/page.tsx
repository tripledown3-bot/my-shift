"use client";

import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { useCurrentUser } from "@/components/UserContext";
import { setCurrentUser } from "@/lib/storage";
import { getPatternsForUser } from "@/lib/types";

export default function SettingsPage() {
  const user = useCurrentUser();
  const router = useRouter();

  const switchUser = () => {
    setCurrentUser(null);
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
          <h3 className="font-bold text-lg mb-3">
            シフト種別（{user.name}用）
          </h3>
          <ul className="divide-y divide-border">
            {getPatternsForUser(user.id).map((p) => (
              <li key={p.code} className="flex items-center gap-3 py-2.5">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold">
                  {p.code}
                </span>
                <div className="flex-1">
                  <div className="font-bold">{p.label}</div>
                  <div className="text-base text-muted">
                    {p.isLeave
                      ? "有給休暇"
                      : p.startTime && p.endTime
                      ? `${p.startTime} 〜 ${p.endTime}`
                      : "時間なし"}
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
              <dd>1.0.0</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">データ保存先</dt>
              <dd>Supabase（クラウド）</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">OCR</dt>
              <dd>Gemini API</dd>
            </div>
          </dl>
          <p className="text-sm text-muted mt-3 leading-relaxed">
            データはクラウドに保存されるので、スマホを変えても消えません。
            <br />
            2人の端末で自動的に同期されます。
          </p>
        </section>
      </main>
    </>
  );
}
