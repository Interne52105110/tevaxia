'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { listOwnedSharedLinks, revokeOwnedSharedLink, loadOwnedLinkDetails, assertSharedLinkAccount, type OwnedSharedLink } from '@/lib/owned-shared-links';
import { buildSharedLinkUrl } from '@/lib/shared-links';
export default function OwnedSharedLinksSection({ user }: { user: { id: string } | null }) {
  return user ? <OwnedLinks key={user.id} owner={user.id} /> : null;
}
function OwnedLinks({ owner }: { owner: string }) {
  const t = useTranslations('ownedLinks'), locale = useLocale(), dateLocale = locale === 'lb' ? 'de-LU' : locale;
  const live = useRef(true), busy = useRef(false);
  const [rows, setRows] = useState<OwnedSharedLink[] | null>(null), [attempt,setAttempt] = useState(0);
  const [loading,setLoading] = useState(false), [error,setError] = useState(false), [copied,setCopied] = useState<string | null>(null);
  const [details,setDetails] = useState<{ id: string; data: Awaited<ReturnType<typeof loadOwnedLinkDetails>> } | null>(null);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    void listOwnedSharedLinks(owner).then(value => { if (active) setRows(value); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [owner, attempt]);
  const reload = () => { if (busy.current) return; setRows(null); setError(false); setDetails(null); setCopied(null); setAttempt(n => n+1); };
  async function action(kind: 'revoke' | 'copy' | 'details', row: OwnedSharedLink) {
    if (busy.current || !live.current) return;
    if (kind === 'revoke' && !window.confirm(t('confirm'))) return;
    busy.current = true; setLoading(true); setError(false); setCopied(null); setDetails(null);
    try {
      if (kind === 'revoke') {
        await revokeOwnedSharedLink(owner, row, () => live.current);
        if (live.current) { setRows(previous => previous?.filter(item => item.id !== row.id) ?? null); setDetails(null); }
      } else if (kind === 'copy') {
        await assertSharedLinkAccount(owner);
        if (!live.current) return;
        await navigator.clipboard.writeText(buildSharedLinkUrl(row.token));
        if (live.current) setCopied(row.id);
      } else {
        const data = await loadOwnedLinkDetails(owner, row);
        if (live.current) setDetails({ id: row.id, data });
      }
    } catch { if (live.current) setError(true); }
    finally { busy.current = false; if (live.current) setLoading(false); }
  }
  const number = (n: number) => new Intl.NumberFormat(locale).format(n);
  return <section className="min-w-0 rounded-xl border border-card-border bg-card p-5 sm:p-6 shadow-sm [overflow-wrap:anywhere]">
    <h2 className="text-lg font-semibold text-navy">{t('title')}</h2>
    <p className="mt-2 text-sm text-muted">{t('scope')}</p>
    <button type="button" onClick={reload} disabled={loading} className="mt-3 text-sm text-navy underline disabled:opacity-50">{t('refresh')}</button>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{t('error')}</p>}
    {!rows && !error && <p role="status" className="mt-3 text-sm text-muted">{t('loading')}</p>}
    {rows?.length === 0 && <p className="mt-4 text-sm text-muted">{t('empty')}</p>}
    {rows && rows.length > 0 && <p className="mt-3 text-sm text-muted">{t('count', { n: number(rows.length) })}</p>}
    <div className="mt-4 space-y-3">{rows?.map(row => <article key={row.id} className="min-w-0 rounded-lg border border-card-border bg-background p-4">
      <h3 className="text-base font-semibold text-navy">{row.title || t('untitled')}</h3>
      <p className="mt-1 text-sm text-muted">{row.tool_type}</p>
      <p className="mt-2 text-sm text-muted">{t('views', { n: number(row.view_count), max: row.max_views === null ? t('unlimited') : number(row.max_views) })}</p>
      <p className="mt-1 text-sm text-muted">{t('expires', { date: new Date(row.expires_at).toLocaleString(dateLocale) })}</p>
      {row.max_views !== null && row.view_count >= row.max_views && <p className="mt-1 text-sm text-amber-800">{t('limitReached')}</p>}
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" disabled={loading} onClick={() => action('copy', row)} className="rounded border border-card-border px-3 py-2 text-sm text-navy disabled:opacity-50">{copied === row.id ? t('copied') : t('copy')}</button>
        <button type="button" disabled={loading} onClick={() => action('details', row)} className="rounded border border-card-border px-3 py-2 text-sm text-navy disabled:opacity-50">{t('details')}</button>
        <button type="button" disabled={loading} onClick={() => action('revoke', row)} className="rounded border border-card-border px-3 py-2 text-sm text-red-700 disabled:opacity-50">{t('revoke')}</button>
      </div>
      {details?.id === row.id && <div className="mt-4 space-y-3">
        <p className="text-sm text-muted">{t('detailScope')}</p>
        <details><summary className="cursor-pointer text-sm text-navy">{t('timeline')}</summary><ul className="mt-2 max-h-64 overflow-y-auto text-sm text-muted">{details.data.timeline.map(day => <li key={day.day} className="flex flex-wrap justify-between gap-2"><span>{new Date(day.day + 'T12:00:00Z').toLocaleDateString(dateLocale)}</span><span>{number(day.views)}</span></li>)}</ul></details>
        <h4 className="text-sm font-semibold text-navy">{t('comments', { n: number(details.data.comments.length) })}</h4>
        {details.data.comments.map(comment => <div key={comment.id} className="rounded border border-card-border p-3 text-sm">
          <p className="font-semibold text-navy">{comment.visitor_name || t('anonymous')}</p>
          {comment.visitor_email && <p className="text-muted">{comment.visitor_email}</p>}
          <p className="text-muted">{new Date(comment.created_at).toLocaleString(dateLocale)}</p><p className="mt-2 whitespace-pre-wrap">{comment.message}</p>
        </div>)}
      </div>}
    </article>)}</div>
  </section>;
}
