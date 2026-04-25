"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, setCurrentUser } from "@/lib/storage";
import { USERS, type UserId } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const current = getCurrentUser();
    if (current) router.replace("/calendar");
  }, [router]);

  const choose = (userId: UserId) => {
    setCurrentUser(userId);
    router.push("/calendar");
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">📅</div>
          <h1 className="text-4xl font-bold text-primary mb-3">家族のシフト</h1>
          <p className="text-muted text-xl">
            だれが使いますか？
          </p>
        </div>

        <div className="space-y-5">
          {(Object.values(USERS) as (typeof USERS)[UserId][]).map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => choose(u.id)}
              className="w-full rounded-3xl bg-white border-4 shadow-md px-6 py-8 flex items-center gap-5 text-3xl font-bold active:scale-[0.98] transition"
              style={{ borderColor: u.color, color: u.color }}
            >
              <span className="text-6xl">{u.emoji}</span>
              <span>{u.name}</span>
              <span className="ml-auto text-4xl">→</span>
            </button>
          ))}
        </div>

        <p className="text-center text-muted mt-10 text-lg">
          パスワードはありません
        </p>
      </div>
    </main>
  );
}
