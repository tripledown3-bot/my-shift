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
      <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2">
        <h1 className="text-xl font-bold flex-1 min-w-0 truncate">{title}</h1>
        <button
          type="button"
          onClick={switchUser}
          className="flex items-center gap-1.5 bg-white/15 rounded-full pl-1.5 pr-3 py-1 text-sm font-semibold shrink-0 compact"
          aria-label="使う人を切り替える"
        >
          <span className="text-xl">{user.emoji}</span>
          <span>{user.name}</span>
        </button>
      </div>
    </header>
  );
}
