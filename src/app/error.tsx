"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10 mb-6">
        <svg className="h-8 w-8 text-error" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-navy mb-2">Une erreur est survenue</h2>
      <p className="text-sm text-muted mb-6 text-center max-w-md">
        Nous nous excusons pour le désagrément. Vous pouvez essayer de recharger la page.
      </p>
      <button onClick={reset} className="rounded-lg bg-navy px-6 py-2.5 text-sm font-medium text-white hover:bg-navy-light transition-colors">
        Réessayer
      </button>
    </div>
  );
}
