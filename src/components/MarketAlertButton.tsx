"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useToast, Toast } from "@/components/Toast";

// ============================================================
// Bell icon SVGs (Heroicons-style, outline and filled)
// ============================================================
function BellOutline({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}

function BellFilled({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z" clipRule="evenodd" />
    </svg>
  );
}

// ============================================================
// LOCAL STORAGE FALLBACK (when Supabase is not configured)
// ============================================================
const ALERT_STORAGE_KEY = "tevaxia_alert_communes";

function getLocalAlerts(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ALERT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalAlerts(communes: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(communes));
}

// ============================================================
// MARKET ALERT BUTTON
// ============================================================

interface MarketAlertButtonProps {
  commune: string;
  /** If true, shows the commune name next to the bell */
  showLabel?: boolean;
}

export default function MarketAlertButton({ commune, showLabel = false }: MarketAlertButtonProps) {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Load current subscription state
  useEffect(() => {
    if (authLoading) return;

    if (user && supabase) {
      // Read from Supabase user metadata
      const alertCommunes: string[] = (user.user_metadata?.alertCommunes as string[]) || [];
      setSubscribed(alertCommunes.includes(commune));
    } else {
      // Fallback to localStorage
      setSubscribed(getLocalAlerts().includes(commune));
    }
  }, [user, authLoading, commune]);

  const toggleSubscription = useCallback(async () => {
    if (!user && supabase) {
      // Supabase configured but not logged in
      setShowLogin(true);
      setTimeout(() => setShowLogin(false), 3000);
      return;
    }

    setLoading(true);
    try {
      if (user && supabase) {
        // Supabase path: update user metadata
        const currentAlerts: string[] = (user.user_metadata?.alertCommunes as string[]) || [];
        const newAlerts = subscribed
          ? currentAlerts.filter((c) => c !== commune)
          : [...currentAlerts, commune];

        const { error } = await supabase.auth.updateUser({
          data: { alertCommunes: newAlerts },
        });

        if (error) {
          console.error("Error updating alerts:", error);
          toast.show("Erreur lors de la mise à jour");
          return;
        }

        setSubscribed(!subscribed);
      } else {
        // localStorage fallback
        const currentAlerts = getLocalAlerts();
        const newAlerts = subscribed
          ? currentAlerts.filter((c) => c !== commune)
          : [...currentAlerts, commune];
        setLocalAlerts(newAlerts);
        setSubscribed(!subscribed);
      }

      toast.show(
        subscribed
          ? `Alerte désactivée pour ${commune}`
          : `Alerte activée pour ${commune}`
      );
    } finally {
      setLoading(false);
    }
  }, [user, commune, subscribed, toast]);

  return (
    <>
      <div className="relative inline-flex items-center">
        <button
          onClick={toggleSubscription}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            subscribed
              ? "border-navy bg-navy/10 text-navy"
              : "border-card-border text-muted hover:bg-background"
          } ${loading ? "opacity-50 cursor-wait" : ""}`}
          title={subscribed ? `Alerte active pour ${commune}` : `Activer l'alerte pour ${commune}`}
        >
          {subscribed ? (
            <BellFilled className="h-4 w-4" />
          ) : (
            <BellOutline className="h-4 w-4" />
          )}
          {showLabel && <span>{commune}</span>}
        </button>

        {/* Login prompt tooltip */}
        {showLogin && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-lg bg-navy px-3 py-2 text-xs text-white text-center shadow-lg z-50">
            Connectez-vous pour activer les alertes
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-navy" />
          </div>
        )}
      </div>
      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}
