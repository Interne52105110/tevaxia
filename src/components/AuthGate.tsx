"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

/**
 * Wraps children in a blur overlay when the user is not authenticated.
 * Shows a CTA to create a free account and access detailed results.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // While checking auth state, render children normally (avoids flash)
  if (loading) return <>{children}</>;

  if (user) return <>{children}</>;

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl">
        <div className="rounded-xl border border-card-border bg-card p-8 text-center shadow-lg max-w-sm mx-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-navy/10 text-navy text-xl font-bold">
            ?
          </div>
          <h3 className="text-base font-semibold text-navy">
            Acc&eacute;dez aux d&eacute;tails
          </h3>
          <p className="mt-2 text-sm text-muted">
            Cr&eacute;ez un compte gratuit pour acc&eacute;der aux d&eacute;tails
          </p>
          <Link
            href="/connexion"
            className="mt-4 inline-block rounded-lg bg-navy px-6 py-2.5 text-sm font-medium text-white hover:bg-navy-light transition-colors"
          >
            Cr&eacute;er un compte gratuit
          </Link>
        </div>
      </div>
    </div>
  );
}
