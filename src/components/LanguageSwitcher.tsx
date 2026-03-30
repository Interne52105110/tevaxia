"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function LanguageSwitcher() {
  const pathname = usePathname();

  // Extract current locale and path without locale
  const currentLocale = pathname.startsWith("/en") ? "en" : "fr";
  const pathWithoutLocale = pathname.replace(/^\/(fr|en)/, "") || "/";

  return (
    <div className="flex gap-0.5 rounded-lg bg-white/10 p-0.5">
      <Link
        href={`/fr${pathWithoutLocale}`}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          currentLocale === "fr" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
        }`}
      >
        FR
      </Link>
      <Link
        href={`/en${pathWithoutLocale}`}
        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
          currentLocale === "en" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
        }`}
      >
        EN
      </Link>
    </div>
  );
}
