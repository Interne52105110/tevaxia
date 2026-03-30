"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuth } from "./AuthProvider";

const NAV_KEYS = [
  { href: "/estimation", key: "estimation" },
  { href: "/carte", key: "carte" },
  { href: "/valorisation", key: "valorisation" },
  { href: "/calculateur-loyer", key: "loyer" },
  { href: "/frais-acquisition", key: "frais" },
  { href: "/plus-values", key: "plusValues" },
  { href: "/simulateur-aides", key: "aides" },
  { href: "/achat-vs-location", key: "achatLocation" },
  { href: "/bilan-promoteur", key: "bilanPromoteur" },
  { href: "/dcf-multi", key: "dcfMulti" },
  { href: "/outils-bancaires", key: "bancaire" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations("nav");
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-navy text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold text-navy-dark font-bold text-lg">
              T
            </div>
            <span className="text-xl font-bold tracking-tight">
              tevaxia<span className="text-gold">.lu</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_KEYS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/mes-evaluations" className="rounded-lg px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                Mes éval.
              </Link>
            ) : (
              <Link href="/connexion" className="rounded-lg bg-gold/90 px-3 py-1 text-xs font-medium text-navy-dark hover:bg-gold transition-colors">
                Connexion
              </Link>
            )}
            <LanguageSwitcher />
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <nav className="lg:hidden border-t border-white/10 py-3 space-y-1">
            {NAV_KEYS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
