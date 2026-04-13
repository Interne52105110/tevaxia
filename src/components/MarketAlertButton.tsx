"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
// LOCAL STORAGE FALLBACK (when user is not logged in)
// ============================================================
const ALERT_STORAGE_KEY = "tevaxia_alert_communes";

interface LocalAlert {
  commune: string;
  targetPriceM2?: number;
  direction: "below" | "above";
}

function getLocalAlerts(): LocalAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ALERT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Migrate old string[] format to LocalAlert[]
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") {
      return parsed.map((c: string) => ({ commune: c, direction: "below" as const }));
    }
    return parsed;
  } catch {
    return [];
  }
}

function setLocalAlerts(alerts: LocalAlert[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(alerts));
}

// ============================================================
// MARKET ALERT BUTTON
// ============================================================

interface MarketAlertButtonProps {
  commune: string;
  /** If true, shows the commune name next to the bell */
  showLabel?: boolean;
  /** Total active alerts count shown as badge (pass from parent if available) */
  activeAlertCount?: number;
}

export default function MarketAlertButton({ commune, showLabel = false, activeAlertCount }: MarketAlertButtonProps) {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [direction, setDirection] = useState<"below" | "above">("below");
  const [alertId, setAlertId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    }
    if (showPopover) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPopover]);

  // Load current subscription state
  useEffect(() => {
    if (authLoading) return;

    if (user && supabase) {
      // Read from market_alerts table
      supabase
        .from("market_alerts")
        .select("id, target_price_m2, direction")
        .eq("commune", commune)
        .eq("active", true)
        .limit(1)
        .then(({ data, error }) => {
          if (error) {
            console.error("Error loading alert:", error);
            return;
          }
          if (data && data.length > 0) {
            setSubscribed(true);
            setAlertId(data[0].id);
            if (data[0].target_price_m2) {
              setTargetPrice(String(data[0].target_price_m2));
            }
            if (data[0].direction) {
              setDirection(data[0].direction);
            }
          } else {
            setSubscribed(false);
            setAlertId(null);
          }
        });
    } else {
      // Fallback to localStorage
      const local = getLocalAlerts().find((a) => a.commune === commune);
      setSubscribed(!!local);
      if (local?.targetPriceM2) setTargetPrice(String(local.targetPriceM2));
      if (local?.direction) setDirection(local.direction);
    }
  }, [user, authLoading, commune]);

  const handleBellClick = useCallback(() => {
    if (!user && supabase) {
      // Supabase configured but not logged in — show login prompt
      setShowLogin(true);
      setTimeout(() => setShowLogin(false), 3000);
      return;
    }

    if (subscribed) {
      // Already subscribed: show popover to manage or unsubscribe
      setShowPopover((prev) => !prev);
    } else {
      // Not subscribed: show popover to configure alert
      setShowPopover(true);
    }
  }, [user, subscribed]);

  const saveAlert = useCallback(async () => {
    setLoading(true);
    try {
      const priceNum = targetPrice ? parseFloat(targetPrice) : null;

      if (user && supabase) {
        if (alertId) {
          // Update existing alert
          const { error } = await supabase
            .from("market_alerts")
            .update({
              target_price_m2: priceNum,
              direction,
              active: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", alertId);

          if (error) {
            console.error("Error updating alert:", error);
            toast.show("Erreur lors de la mise a jour");
            return;
          }
        } else {
          // Insert new alert
          const { data, error } = await supabase
            .from("market_alerts")
            .insert({
              user_id: user.id,
              commune,
              target_price_m2: priceNum,
              direction,
              active: true,
            })
            .select("id")
            .single();

          if (error) {
            console.error("Error saving alert:", error);
            toast.show("Erreur lors de la sauvegarde");
            return;
          }

          setAlertId(data.id);
        }
        setSubscribed(true);
      } else {
        // localStorage fallback
        const alerts = getLocalAlerts().filter((a) => a.commune !== commune);
        alerts.push({ commune, targetPriceM2: priceNum ?? undefined, direction });
        setLocalAlerts(alerts);
        setSubscribed(true);
      }

      toast.show(`Alerte activee pour ${commune}`);
      setShowPopover(false);
    } finally {
      setLoading(false);
    }
  }, [user, commune, targetPrice, direction, alertId, toast]);

  const removeAlert = useCallback(async () => {
    setLoading(true);
    try {
      if (user && supabase && alertId) {
        const { error } = await supabase
          .from("market_alerts")
          .delete()
          .eq("id", alertId);

        if (error) {
          console.error("Error deleting alert:", error);
          toast.show("Erreur lors de la suppression");
          return;
        }
      } else {
        // localStorage fallback
        const alerts = getLocalAlerts().filter((a) => a.commune !== commune);
        setLocalAlerts(alerts);
      }

      setSubscribed(false);
      setAlertId(null);
      setTargetPrice("");
      setDirection("below");
      toast.show(`Alerte desactivee pour ${commune}`);
      setShowPopover(false);
    } finally {
      setLoading(false);
    }
  }, [user, commune, alertId, toast]);

  return (
    <>
      <div className="relative inline-flex items-center" ref={popoverRef}>
        <button
          onClick={handleBellClick}
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
          {/* Badge with active alert count */}
          {activeAlertCount !== undefined && activeAlertCount > 0 && (
            <span className="ml-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white px-1">
              {activeAlertCount}
            </span>
          )}
        </button>

        {/* Login prompt tooltip */}
        {showLogin && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-lg bg-navy px-3 py-2 text-xs text-white text-center shadow-lg z-50">
            Connectez-vous pour activer les alertes
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-navy" />
          </div>
        )}

        {/* Alert configuration popover */}
        {showPopover && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-xl border border-card-border bg-card p-4 shadow-lg z-50">
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-navy">
                Alerte pour {commune}
              </h3>

              {/* Target price input */}
              <div>
                <label className="block text-[11px] text-muted mb-1">
                  Prix cible (EUR/m2)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="ex: 8000"
                  className="w-full rounded-lg border border-input-border bg-input-bg px-2.5 py-1.5 text-xs shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
              </div>

              {/* Direction select */}
              <div>
                <label className="block text-[11px] text-muted mb-1">
                  Me notifier quand le prix est
                </label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as "below" | "above")}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-2.5 py-1.5 text-xs shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                >
                  <option value="below">En dessous du prix cible</option>
                  <option value="above">Au-dessus du prix cible</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveAlert}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-light transition-colors disabled:opacity-50"
                >
                  {subscribed ? "Mettre a jour" : "Activer"}
                </button>
                {subscribed && (
                  <button
                    onClick={removeAlert}
                    disabled={loading}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>

            {/* Arrow pointing down */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-card-border" />
          </div>
        )}
      </div>
      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}
