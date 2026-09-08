"use client";

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import InputField from '@/components/InputField';
import ToggleField from '@/components/ToggleField';
import { simulerAides, type AidesInput, type AideDetail } from '@/lib/aides-logement';
import { formatEUR2 } from '@/lib/calculations';
import { PdfButton } from '@/components/PdfButton';
import SaveButton from '@/components/SaveButton';
import { sauvegarderEvaluation } from '@/lib/storage';
import AuthGate from '@/components/AuthGate';

const parseSavings = (s: string): number[] | undefined => s.trim() ? s.split(';').map(n => n.trim() ? Number(n.trim().replace(',', '.')) : NaN) : undefined;
export default function SimulateurAides() {
  const t = useTranslations('aidesAudit');
  const old = useTranslations('simulateurAides');
  const locale = useLocale(), lp = locale === 'fr' ? '' : `/${locale}`;
  const [form, setForm] = useState<AidesInput>({ typeProjet: 'acquisition', prixBien: 750000, montantTravaux: 0, revenuMenage: 80000, nbEmprunteurs: 2, nbAdultes: 2, nbEnfants: 1, typeBien: 'appartement', residencePrincipale: true, estNeuf: false, montantPret: 600000, revenuNet2024: 76000, revenuNet2025: 80000, anneeProjet: 2026, tauxPret: 3.5, quotePartPremier: .5 });
  const [credit1, setCredit1] = useState(40000), [credit2, setCredit2] = useState(40000);
  const [pot1, setPot1] = useState(35000), [pot2, setPot2] = useState(35000);
  const [growth1, setGrowth1] = useState(''), [growth2, setGrowth2] = useState('');
  const [baseDroits, setBaseDroits] = useState('');
  const [baseTva, setBaseTva] = useState(''), [soldeTva, setSoldeTva] = useState('');
  const update = <K extends keyof AidesInput>(key: K, value: AidesInput[K]) => setForm(f => ({ ...f, [key]: value }));
  const simulationInput = useMemo(() => {
    const g1 = parseSavings(growth1), g2 = parseSavings(growth2);
    return { ...form, creditsRestants: form.nbEmprunteurs === 1 ? [credit1] : [credit1, credit2], potsCapitalRestants: form.nbEmprunteurs === 1 ? [pot1] : [pot1, pot2], accroissementsEpargne: g1 && (form.nbEmprunteurs === 1 || g2) ? (form.nbEmprunteurs === 1 ? [g1] : [g1, g2!]) : undefined, baseDroits: form.typeProjet === 'acquisition' && !form.estNeuf ? form.prixBien : baseDroits === '' ? undefined : Number(baseDroits), baseTvaEligibleHT: baseTva === '' ? undefined : Number(baseTva), faveurTvaRestante: soldeTva === '' ? undefined : Number(soldeTva) };
  }, [form, credit1, credit2, pot1, pot2, growth1, growth2, baseDroits, baseTva, soldeTva]);
  const { result, error } = useMemo(() => {
    try { return { result: simulerAides(simulationInput), error: false }; }
    catch { return { result: null, error: true }; }
  }, [simulationInput]);
  const acquisition = form.typeProjet !== 'renovation';
  const works = form.typeProjet === 'renovation' || (form.montantTravaux ?? 0) > 0;
  const money = (a: AideDetail) => a.montant === null ? t('unknown') : `${formatEUR2(a.montant)}${a.periodicite === 'mensuelle' ? t('perMonth') : ''}`;
  const number = (key: keyof AidesInput, label: string, suffix = '€', min = 0, max?: number) => <InputField label={label} value={form[key] as number ?? ''} onChange={v => update(key, v === '' ? undefined : Number(v))} min={min} max={max} suffix={suffix} />;
  const conditions = (key: keyof AidesInput, label: string) => <ToggleField label={label} checked={form[key] === true} onChange={v => update(key, v)} />;
  const panel = 'rounded-xl border border-card-border bg-card p-5 sm:p-6 space-y-4';
  return <main className="bg-background py-8 sm:py-12"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <h1 className="text-2xl sm:text-3xl font-bold text-navy">{t('title')}</h1>
    <p className="mt-3 text-muted max-w-4xl">{t('intro')}</p>
    <p className="mt-2 text-sm text-muted">{t('date')}</p>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <section className={panel}><h2 className="font-semibold text-lg text-navy">{t('project')}</h2>
          <InputField label={old('typeProjet')} type="select" value={form.typeProjet} onChange={v => setForm(f => ({ ...f, typeProjet: v as AidesInput['typeProjet'], estNeuf: v === 'construction' }))} options={['acquisition','construction','renovation'].map(v => ({value:v,label:t(v)}))} />
          {conditions('residencePrincipale', t('rp'))}
          {acquisition && <>
            {number('prixBien', t('price'))}
            <InputField label={t('buyers')} type="select" value={form.nbEmprunteurs} onChange={v => update('nbEmprunteurs', Number(v) as 1 | 2)} options={[{value:'1',label:'1'},{value:'2',label:'2'}]} />
            <InputField label={old('typeBien')} type="select" value={form.typeBien} onChange={v => update('typeBien', v as AidesInput['typeBien'])} options={['appartement','maison_rangee','maison_jumelee','maison_isolee'].map(v => ({value:v,label:t(v)}))} />
            {form.typeProjet === 'acquisition' && conditions('estNeuf', t('new'))}
          </>}
          {number('montantTravaux', t('works'))}
          {number('montantPret', t('loan'))}
          <p className="text-sm text-muted">{t('worksNote')}</p>
        </section>
        {form.residencePrincipale && <section className={panel}><h2 className="font-semibold text-lg text-navy">{t('household')}</h2>
          {number('nbAdultes', t('adults'), '', 1)}{number('nbEnfants', t('children'), '')}
          {number('revenuNet2024', t('income24'))}{number('revenuNet2025', t('income25'))}
          <p className="text-sm text-muted">{t('incomeNote')}</p>
          {acquisition && <>
            <InputField label={t('pot1')} value={pot1} onChange={v => setPot1(Number(v))} min={0} max={35000} suffix="€" />
            {form.nbEmprunteurs === 2 && <InputField label={t('pot2')} value={pot2} onChange={v => setPot2(Number(v))} min={0} max={35000} suffix="€" />}
            {conditions('conditionsAccessionConfirmees', t('accessionConfirm'))}
            <InputField label={t('savings1')} type="text" value={growth1} onChange={setGrowth1} hint={t('savingsHint')} />
            {form.nbEmprunteurs === 2 && <InputField label={t('savings2')} type="text" value={growth2} onChange={setGrowth2} hint={t('savingsHint')} />}
            {conditions('conditionsEpargneConfirmees', t('savingsConfirm'))}
          </>}
          {(form.montantPret ?? 0) > 0 && <>
            {number('tauxPret', t('rate'), '%')}
            <ToggleField label={t('interestConfirm')} checked={form.conditionsInteretConfirmees === true} onChange={v => setForm(f => ({ ...f, conditionsInteretConfirmees: v, nouveauPret: v }))} />
          </>}
        </section>}
        {form.residencePrincipale && <section className={panel}><h2 className="font-semibold text-lg text-navy">{t('tax')}</h2>
          {acquisition && <>
            <InputField label={t('credit1')} value={credit1} onChange={v => setCredit1(Number(v))} min={0} max={40000} suffix="€" />
            {form.nbEmprunteurs === 2 && <>
              <InputField label={t('credit2')} value={credit2} onChange={v => setCredit2(Number(v))} min={0} max={40000} suffix="€" />
              <InputField label={t('share')} value={(form.quotePartPremier ?? .5) * 100} onChange={v => update('quotePartPremier', Number(v) / 100)} min={1} max={99} suffix="%" />
            </>}
            {(form.estNeuf || form.typeProjet === 'construction') && <InputField label={t('rightsBase')} value={baseDroits} onChange={setBaseDroits} min={0} suffix="€" hint={t('rightsHint')} />}
            {conditions('conditionsBellegenConfirmees', t('creditConfirm'))}
          </>}
          {(works || form.estNeuf || form.typeProjet === 'construction') && <>
            <InputField label={t('vatBase')} value={baseTva} onChange={setBaseTva} min={0} suffix="€" />
            <InputField label={t('vatRemaining')} value={soldeTva} onChange={setSoldeTva} min={0} max={50000} suffix="€" />
            {conditions('conditionsTvaConfirmees', t('vatConfirm'))}
          </>}
          <Link className="text-sm text-navy underline" href={`${lp}/frais-acquisition`}>{t('acquisitionLink')}</Link>
        </section>}
      </div>
      <div className="space-y-6">
        {error && <p role="alert" className="rounded-xl bg-red-50 text-red-800 p-5">{t('error')}</p>}
        {result && <>
          <section className="rounded-xl bg-navy text-white p-5 sm:p-6 space-y-4" aria-live="polite">
            <h2 className="text-lg font-semibold">{t('subtotal')}</h2>
            <p className="font-bold text-3xl" data-testid="aides-subtotal">{result.aides.some(a => a.periodicite === 'unique' && a.nature !== 'garantie' && a.montant !== null) ? formatEUR2(result.totalGeneral) : t('unknown')}</p>
            <p className="text-sm text-white/80">{t('subtotalNote')}</p>
            <div className="flex flex-wrap gap-5 text-sm"><p>{t('grants')} : {formatEUR2(result.totalAidesDirectes)}</p><p>{t('taxSavings')} : {formatEUR2(result.totalEconomies)}</p></div>
            <p className="border-t border-white/20 pt-3">{t('monthly')} : <strong>{result.subventionMensuelle === null ? t('unknown') : formatEUR2(result.subventionMensuelle) + t('perMonth')}</strong></p>
            <p className="text-sm text-white/80">{t('pending', { n: result.aidesNonChiffrees })}</p>
          </section>
          <p className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4 text-sm">{t('scope')}</p>
          {!form.residencePrincipale && <p className="text-sm text-muted">{t('nonRp')}</p>}
          <div className="flex flex-wrap gap-3 justify-end">
            <SaveButton label={t('save')} successLabel={t('saved')} onClick={() => sauvegarderEvaluation({nom:`Aides 2026 — ${form.typeProjet}`,type:'aides',valeurPrincipale:result.totalGeneral,data:{...simulationInput,estimationComplete:result.estimationComplete,aidesNonChiffrees:result.aidesNonChiffrees}})} />
            <PdfButton label="PDF" filename="aides-logement-2026.pdf" generateBlob={async () => (await import('@/components/ToolsPdf')).generateAidesPdfBlob({profil:t(form.typeProjet),revenus:`2024: ${form.revenuNet2024 === undefined ? t('unknown') : formatEUR2(form.revenuNet2024)} ; 2025: ${form.revenuNet2025 === undefined ? t('unknown') : formatEUR2(form.revenuNet2025)}`,aides:result.aides.map(a => ({label:t(`names.${a.id}`),montant:a.montant,description:`${t(`descriptions.${a.id}`)} ${a.source}`,periodicite:a.periodicite})),totalAides:result.totalAidesDirectes,economiesFiscales:result.totalEconomies,totalAvantage:result.totalGeneral,scope:t('scope'),unknownLabel:t('unknown'),monthlyLabel:t('perMonth')})} />
          </div>
          <AuthGate><div className="space-y-4">{result.aides.map(a => <article key={a.id} className={panel}>
            <div className="flex flex-wrap justify-between gap-3"><h3 className="font-semibold text-navy">{t(`names.${a.id}`)}</h3><strong className="text-navy">{money(a)}</strong></div>
            <p className="text-sm text-muted">{t(`descriptions.${a.id}`)}</p>
            <a className="text-sm text-navy underline" href={a.source} target="_blank" rel="noopener noreferrer">{t('source')}</a>
          </article>)}</div></AuthGate>
          <section className={panel}><h2 className="text-lg font-semibold text-navy">{t('next')}</h2><p className="text-sm text-muted">{t('nextNote')}</p>
            <a className="block text-navy underline" href="https://logement.public.lu/fr/proprietaire/obtenir-aide-achat-construction/prime-accession-propriete.html">{t('officialHousing')}</a>
            <a className="block text-navy underline" href="https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/renovation-energetique-logement.html">{t('officialEnergy')}</a>
          </section>
        </>}
      </div>
    </div>
  </div></main>;
}
