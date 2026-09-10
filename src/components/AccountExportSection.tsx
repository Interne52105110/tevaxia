'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { buildDataExport, downloadAsJsonFile } from '@/lib/data-export';
export default function AccountExportSection({ user }: { user: { id: string } | null }) {
  return user ? <OwnedExport key={user.id} owner={user.id} /> : null;
}
function OwnedExport({ owner }: { owner: string }) {
  const t = useTranslations('accountExport');
  const live = useRef(true), busy = useRef(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  async function handleExport() {
    if (busy.current) return;
    busy.current = true; setStatus('loading');
    try {
      const data = await buildDataExport(owner);
      if (!live.current) return;
      downloadAsJsonFile(data); setStatus('done');
    } catch { if (live.current) setStatus('error'); }
    finally { busy.current = false; }
  }
  return <section className="min-w-0 rounded-xl border border-card-border bg-card p-6 shadow-sm [overflow-wrap:anywhere]">
    <h2 className="text-base font-semibold text-navy">{t('title')}</h2>
    <p className="mt-3 text-sm text-muted">{t('scope')}</p>
    <p className="mt-3 text-sm text-muted">{t('limits')}</p>
    <button type="button" disabled={status === 'loading'} onClick={handleExport} className="mt-4 rounded-lg border border-card-border bg-background px-4 py-2 text-sm font-medium text-navy disabled:opacity-50">{t(status === 'loading' ? 'loading' : 'download')}</button>
    {status === 'error' && <p role="alert" className="mt-3 text-sm text-red-700">{t('error')}</p>}
    {status === 'done' && <p role="status" className="mt-3 text-sm text-emerald-700">{t('done')}</p>}
  </section>;
}
