/**
 * Skeleton loaders réutilisables — animation pulse Tailwind, accessibilité
 * (role status + sr-only label) pour annoncer le chargement aux lecteurs
 * d'écran sans bruit visuel.
 *
 * Usage :
 *   <SkeletonText lines={3} />
 *   <SkeletonCard />
 *   <SkeletonTable rows={5} cols={6} />
 *   <SkeletonStat />
 */

interface BaseProps {
  className?: string;
  label?: string;
}

export function SkeletonBox({ className = "", label = "Chargement…" }: BaseProps) {
  return (
    <div role="status" aria-label={label}
      className={`animate-pulse rounded bg-card-border/50 ${className}`}>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div role="status" aria-label="Chargement du texte" className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i}
          className={`animate-pulse h-3 rounded bg-card-border/50 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
      <span className="sr-only">Chargement du texte</span>
    </div>
  );
}

export function SkeletonStat({ className = "" }: { className?: string }) {
  return (
    <div role="status" aria-label="Chargement de la statistique"
      className={`rounded-xl border border-card-border bg-card p-4 ${className}`}>
      <div className="animate-pulse h-2 w-20 rounded bg-card-border/50" />
      <div className="animate-pulse mt-2 h-7 w-24 rounded bg-card-border/50" />
      <span className="sr-only">Chargement</span>
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div role="status" aria-label="Chargement de la carte"
      className={`rounded-xl border border-card-border bg-card p-5 ${className}`}>
      <div className="animate-pulse h-3 w-16 rounded bg-card-border/50" />
      <div className="animate-pulse mt-2 h-5 w-3/4 rounded bg-card-border/50" />
      <div className="animate-pulse mt-3 h-3 w-full rounded bg-card-border/50" />
      <div className="animate-pulse mt-2 h-3 w-5/6 rounded bg-card-border/50" />
      <span className="sr-only">Chargement</span>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = "" }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div role="status" aria-label="Chargement du tableau"
      className={`overflow-hidden rounded-xl border border-card-border bg-card ${className}`}>
      <div className="border-b border-card-border bg-background p-2">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }, (_, i) => (
            <div key={i} className="animate-pulse h-2 rounded bg-card-border/50" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-card-border/50">
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="grid gap-2 p-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }, (_, c) => (
              <div key={c} className="animate-pulse h-3 rounded bg-card-border/50" />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Chargement du tableau</span>
    </div>
  );
}

export function SkeletonGrid({ items = 4, className = "" }: { items?: number; className?: string }) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-${items > 2 ? "4" : "2"} ${className}`}>
      {Array.from({ length: items }, (_, i) => <SkeletonStat key={i} />)}
    </div>
  );
}
