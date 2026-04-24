"use client";

import { useRouter } from "next/navigation";
import { setCurrentUser } from "@/lib/storage";
import type { User } from "@/lib/types";

type Props = {
  title: string;
  user: User;
};

export function AppHeader({ title, user }: Props) {
  const router = useRouter();
  const switchUser = () => {
    if (confirm("使う人を切り替えますか？")) {
      setCurrentUser(null);
      router.push("/");
    }
  };

  return (
    <header className="bg-primary text-white sticky top-0 z-10 shadow-sm">
      <div className="max-w-md mx-auto px-5 py-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold flex-1">{title}</h1>
        <button
          type="button"
          onClick={switchUser}
          className="flex items-center gap-2 bg-white/15 rounded-full pl-2 pr-4 py-1 text-base font-semibold"
          aria-label="使う人を切り替える"
        >
          <span className="text-2xl">{user.emoji}</span>
          <span>{user.name}</span>
        </button>
      </div>
    </header>
  );
}
