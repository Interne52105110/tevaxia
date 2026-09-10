'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/components/AuthProvider';
import { isSupabaseConfigured } from '@/lib/supabase';
import { buildSharedLinkUrl, type SharedToolType } from '@/lib/shared-links';
import { createOwnedSharedLink, assertSharedLinkAccount, type OwnedSharedLink } from '@/lib/owned-shared-links';
import { prepareSharedLinkDraft, sharedPayloadJson, type SharedLinkDraft } from '@/lib/shared-link-draft';
interface Props { toolType: SharedToolType; payload: Record<string, unknown>; defaultTitle?: string; className?: string }
export default function OwnedShareLinkButton(props: Props) {
  const { user } = useAuth(), t = useTranslations('shareCreation');
  if (!isSupabaseConfigured || !user) return null;
  let snapshot: string;
  try { snapshot = sharedPayloadJson(props.payload); }
  catch { return <p role="alert" className="text-sm text-red-700">{t('invalidPayload')}</p>; }
  return <ShareEditor key={JSON.stringify([user.id,props.toolType,props.defaultTitle,snapshot])} {...props} owner={user.id} snapshot={snapshot} />;
}
function ShareEditor({ owner, toolType, snapshot, defaultTitle, className }: Omit<Props, 'payload'> & { owner: string; snapshot: string }) {
  const t = useTranslations('shareCreation'), locale = useLocale(), id = useId();
  const live = useRef(true), busy = useRef(false), draft = useRef<{ fingerprint: string; value: SharedLinkDraft } | null>(null);
  const [open,setOpen] = useState(false), [loading,setLoading] = useState(false), [error,setError] = useState<'invalid'|'uncertain'|'copyFailed'|null>(null);
  const [title,setTitle] = useState(defaultTitle ?? ''), [days,setDays] = useState('30'), [views,setViews] = useState('');
  const [created,setCreated] = useState<OwnedSharedLink | null>(null), [copied,setCopied] = useState(false);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  async function create() {
    if (busy.current) return;
    try {
      const candidate = prepareSharedLinkDraft(owner, { tool_type: toolType, payload: JSON.parse(snapshot), title, days, maxViews: views });
      const fingerprint = JSON.stringify([candidate.title,Number(days),candidate.max_views]);
      if (draft.current?.fingerprint !== fingerprint) draft.current = { fingerprint, value: candidate };
    } catch { setError('invalid'); return; }
    busy.current = true; setLoading(true); setError(null);
    try {
      const result = await createOwnedSharedLink(owner, draft.current.value, () => live.current);
      if (live.current) setCreated(result);
    } catch { if (live.current) setError('uncertain'); }
    finally { busy.current = false; if (live.current) setLoading(false); }
  }
  async function copy() {
    if (!created || busy.current) return;
    busy.current = true; setLoading(true); setError(null); setCopied(false);
    try { await assertSharedLinkAccount(owner); if (!live.current) return; await navigator.clipboard.writeText(buildSharedLinkUrl(created.token)); if (live.current) setCopied(true); }
    catch { if (live.current) setError('copyFailed'); }
    finally { busy.current = false; if (live.current) setLoading(false); }
  }
  return <div className={className}>
    <button type="button" disabled={loading} aria-expanded={open} aria-controls={id+'-editor'} onClick={() => setOpen(value=>!value)} className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{t('open')}</button>
    {open && <section id={id+'-editor'} className="mt-3 min-w-0 rounded-xl border border-card-border bg-card p-5 shadow-sm [overflow-wrap:anywhere]">
      <h3 className="text-base font-semibold text-navy">{t(created ? 'created' : 'title')}</h3>
      <p className="mt-2 text-sm text-muted">{t('scope')}</p>
      {!created ? <>
        <div className="mt-4 space-y-3">
          <label htmlFor={id+'-title'} className="block text-sm text-navy">{t('labelTitle')}</label>
          <input id={id+'-title'} value={title} maxLength={200} disabled={loading} onChange={e=>setTitle(e.target.value)} className="w-full min-w-0 rounded border border-input-border bg-input-bg px-3 py-2 text-sm" />
          <label htmlFor={id+'-days'} className="block text-sm text-navy">{t('days')}</label>
          <input id={id+'-days'} value={days} inputMode="numeric" disabled={loading} onChange={e=>setDays(e.target.value)} className="w-full min-w-0 rounded border border-input-border bg-input-bg px-3 py-2 text-sm" />
          <label htmlFor={id+'-views'} className="block text-sm text-navy">{t('views')}</label>
          <input id={id+'-views'} value={views} inputMode="numeric" disabled={loading} onChange={e=>setViews(e.target.value)} className="w-full min-w-0 rounded border border-input-border bg-input-bg px-3 py-2 text-sm" />
        </div>
        <button type="button" disabled={loading} onClick={create} className="mt-4 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{t(loading ? 'loading' : 'generate')}</button>
      </> : <>
        <p className="mt-3 text-sm text-muted">{t('expires', { date: new Date(created.expires_at).toLocaleString(locale === 'lb' ? 'de-LU' : locale) })}</p>
        <code className="mt-3 block break-all rounded border border-card-border bg-background p-3 text-sm">{buildSharedLinkUrl(created.token)}</code>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" disabled={loading} onClick={copy} className="rounded border border-card-border px-3 py-2 text-sm text-navy disabled:opacity-50">{t(copied ? 'copied' : 'copy')}</button>
          <button type="button" disabled={loading} onClick={()=>{draft.current=null;setCreated(null);setCopied(false);setError(null)}} className="rounded border border-card-border px-3 py-2 text-sm text-navy disabled:opacity-50">{t('another')}</button>
        </div>
      </>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{t(error)}</p>}
    </section>}
  </div>;
}
