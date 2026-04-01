"use client";

import { usePathname } from "next/navigation";

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const isEN = pathname === "/en" || pathname.startsWith("/en/");

  // Build the alternate path
  const frPath = isEN ? pathname.replace(/^\/en\/?/, "/") : pathname;
  const enPath = isEN ? pathname : `/en${pathname}`;

  return (
    <div className="flex gap-0.5 rounded-lg bg-white/10 p-0.5">
      <a
        href={frPath}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          !isEN ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
        }`}
      >
        FR
      </a>
      <a
        href={enPath}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          isEN ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
        }`}
      >
        EN
      </a>
    </div>
  );
}
