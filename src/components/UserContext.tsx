"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { User } from "@/lib/types";

const UserContext = createContext<User | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useCurrentUser(): User {
  const u = useContext(UserContext);
  if (!u) throw new Error("useCurrentUser must be used inside UserProvider");
  return u;
}
