"use client";

import { useRouter } from "next/navigation";

export default function LanguageSwitcher() {
  const router = useRouter();

  const switchLocale = (locale: string) => {
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    router.refresh();
  };

  return (
    <div className="flex gap-1">
      <button
        onClick={() => switchLocale("fr")}
        className="rounded px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        FR
      </button>
      <button
        onClick={() => switchLocale("en")}
        className="rounded px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        EN
      </button>
    </div>
  );
}
