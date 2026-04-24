"use client";

import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { useCurrentUser } from "@/components/UserContext";

const OPTIONS = [
  {
    href: "/register/photo",
    icon: "📷",
    title: "写真から読みとる",
    desc: "紙のシフト表を撮影して登録",
    tone: "bg-mom/10 border-mom text-mom",
  },
  {
    href: "/register/bulk",
    icon: "🗓️",
    title: "カレンダーから選ぶ",
    desc: "同じ時間のシフトをまとめて登録",
    tone: "bg-son/10 border-son text-son",
  },
  {
    href: "/register/plan",
    icon: "⭐",
    title: "予定を書く",
    desc: "通院・学校行事などを登録",
    tone: "bg-accent/10 border-accent text-accent",
  },
] as const;

export default function RegisterPage() {
  const user = useCurrentUser();
  return (
    <>
      <AppHeader title="登録する" user={user} />
      <main className="flex-1 max-w-md w-full mx-auto px-5 py-6">
        <p className="text-lg text-muted mb-5">
          どの方法で登録しますか？
        </p>
        <div className="space-y-4">
          {OPTIONS.map((o) => (
            <Link
              key={o.href}
              href={o.href}
              className={`block rounded-2xl border-2 p-5 bg-white shadow-sm active:scale-[0.98] transition ${o.tone}`}
            >
              <div className="flex items-center gap-4">
                <span className="text-5xl">{o.icon}</span>
                <div className="flex-1">
                  <div className="text-xl font-bold">{o.title}</div>
                  <div className="text-base text-muted mt-0.5">{o.desc}</div>
                </div>
                <span className="text-3xl">→</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
