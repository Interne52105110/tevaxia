export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-navy/20 border-t-navy" />
        <p className="text-sm text-muted">Chargement...</p>
      </div>
    </div>
  );
}
