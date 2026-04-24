"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/calendar", label: "カレンダー", icon: "📅" },
  { href: "/register", label: "登録", icon: "➕" },
  { href: "/memo", label: "メモ", icon: "📝" },
  { href: "/settings", label: "設定", icon: "⚙️" },
] as const;

export function BottomTabs() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 bg-white border-t-2 border-border safe-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <ul className="max-w-md mx-auto grid grid-cols-4">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center py-3 min-h-[76px] font-semibold active:bg-primary/10 transition ${
                  active ? "text-primary" : "text-muted"
                }`}
              >
                <span className="text-3xl leading-none mb-1">{t.icon}</span>
                <span className="text-base">{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
