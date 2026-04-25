"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomTabs } from "@/components/BottomTabs";
import { UserProvider } from "@/components/UserContext";
import { getCurrentUser } from "@/lib/storage";
import { USERS, type User } from "@/lib/types";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const id = getCurrentUser();
    if (!id) {
      router.replace("/");
      return;
    }
    setUser(USERS[id]);
  }, [router]);

  if (!user) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-muted">読み込み中…</p>
      </main>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-20">
      <UserProvider user={user}>{children}</UserProvider>
      <BottomTabs />
    </div>
  );
}
