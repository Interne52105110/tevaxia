"use client";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/lib/analytics-consent";
export default function CookieSettingsButton({ label, className }: { label: string; className?: string }) {
  return <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}>{label}</button>;
}
