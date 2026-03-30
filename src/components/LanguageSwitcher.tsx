"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const isEN = pathname.startsWith("/en");

  // Build the alternate path
  const frPath = isEN ? pathname.replace(/^\/en/, "") || "/" : pathname;
  const enPath = isEN ? pathname : `/en${pathname}`;

  return (
    <div className="flex gap-0.5 rounded-lg bg-white/10 p-0.5">
      <Link
        href={frPath}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          !isEN ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
        }`}
      >
        FR
      </Link>
      <Link
        href={enPath}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          isEN ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
        }`}
      >
        EN
      </Link>
    </div>
  );
}
