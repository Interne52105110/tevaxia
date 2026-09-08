"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface SaveButtonProps {
  onClick: () => unknown | Promise<unknown>;
  label?: string;
  successLabel?: string;
}

export default function SaveButton({ onClick, label, successLabel }: SaveButtonProps) {
  const t = useTranslations("saveButton");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const handleClick = async () => {
    if (busy.current) return;
    busy.current = true;
    setState("saving");
    try {
      await onClick();
      setState("done");
      timer.current = setTimeout(() => {
        setState("idle");
        busy.current = false;
      }, 2500);
    } catch {
      setState("error");
      busy.current = false;
    }
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
    <button
      onClick={handleClick}
      disabled={state === "saving" || state === "done"}
      className={`
        inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold
        transition-all duration-200 active:scale-95
        ${state === "done"
          ? "bg-green-600 text-white border border-green-600 shadow-sm"
          : state === "saving"
          ? "bg-navy/80 text-white border border-navy/80 scale-95"
          : "bg-navy text-white border border-navy shadow-sm hover:bg-navy-light hover:shadow-md"
        }
      `}
    >
      {state === "done" ? (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {successLabel ?? t("saved")}
        </>
      ) : state === "saving" ? (
        <>
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          {t("saving")}
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
          {label ?? t("save")}
        </>
      )}
    </button>
    {state === "error" && <span role="alert" className="max-w-xs text-xs text-rose-700">{t("error")}</span>}
    </span>
  );
}
