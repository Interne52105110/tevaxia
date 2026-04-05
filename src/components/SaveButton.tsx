"use client";

import { useState } from "react";

interface SaveButtonProps {
  onClick: () => void;
  label?: string;
  successLabel?: string;
}

export default function SaveButton({ onClick, label = "Sauvegarder", successLabel = "Sauvegardé !" }: SaveButtonProps) {
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");

  const handleClick = () => {
    setState("saving");
    onClick();
    setTimeout(() => setState("done"), 300);
    setTimeout(() => setState("idle"), 2500);
  };

  return (
    <button
      onClick={handleClick}
      disabled={state !== "idle"}
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
          {successLabel}
        </>
      ) : state === "saving" ? (
        <>
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Sauvegarde...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
