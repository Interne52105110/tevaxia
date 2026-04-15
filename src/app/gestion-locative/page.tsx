"use client";

import Link from "next/link";
import { useLocale } from "next-intl";

export default function GestionLocativeLanding() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  return (
    <div className="bg-background">
      <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-700 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
            Nouveau · Niche LU
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-5xl">
            Gestion locative au Luxembourg
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-white/80">
            Suivez votre portefeuille avec les spécificités luxembourgeoises que les outils FR/BE ignorent : règle des 5 %,
            impact Klimabonus et alertes sur les loyers hors plafond.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`${lp}/gestion-locative/portefeuille`}
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-teal-900 hover:bg-white/90"
            >
              Accéder au portefeuille →
            </Link>
            <Link
              href={`${lp}/calculateur-loyer`}
              className="rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 backdrop-blur-sm"
            >
              Tester la règle des 5 %
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-navy">Ce que les autres outils ne font pas</h2>
        <p className="mt-2 text-sm text-muted">
          Rentila, Smovin, AppFolio : tous pensés pour des marchés où le loyer n&apos;est pas plafonné de la même manière.
          Le droit locatif luxembourgeois impose des règles que seul un outil local peut vérifier automatiquement.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-card-border bg-card p-5">
            <div className="text-teal-700 text-2xl">⚖️</div>
            <h3 className="mt-2 text-sm font-semibold text-navy">Règle des 5 %</h3>
            <p className="mt-1 text-xs text-muted">
              Loyer annuel max = 5 % du capital investi réévalué avec décote de vétusté. Tout loyer supérieur est
              juridiquement réductible par le locataire.
            </p>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-5">
            <div className="text-emerald-700 text-2xl">🔥</div>
            <h3 className="mt-2 text-sm font-semibold text-navy">Klimabonus</h3>
            <p className="mt-1 text-xs text-muted">
              Détection automatique des lots classés E/F/G éligibles à la rénovation énergétique subventionnée
              (jusqu&apos;à 65 % des travaux + prime CO₂).
            </p>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-5">
            <div className="text-amber-700 text-2xl">📊</div>
            <h3 className="mt-2 text-sm font-semibold text-navy">Rendement réel</h3>
            <p className="mt-1 text-xs text-muted">
              Coefficient de réévaluation STATEC + décote 1 %/an automatiques. Votre rendement brut est comparé au
              rendement maximal légal atteignable.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy">Pour qui ?</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-card-border bg-card p-5">
              <h3 className="text-sm font-semibold text-navy">Propriétaires 1 à 10 lots</h3>
              <p className="mt-2 text-xs text-muted">
                Multi-biens au Luxembourg. Vérifiez la conformité légale de chaque loyer, suivez la rentabilité
                agrégée, identifiez les lots à rénover en priorité.
              </p>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-5">
              <h3 className="text-sm font-semibold text-navy">Syndics &amp; gestionnaires 10-100 lots</h3>
              <p className="mt-2 text-xs text-muted">
                Pilotage portefeuille pour compte de tiers. Alertes automatiques sur lots hors plafond légal,
                simulations de revalorisation post-travaux.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Statut MVP :</strong> les lots sont persistés localement dans votre navigateur. Pour un multi-poste
            synchronisé (organisation, invitations collaborateurs), nous intégrerons Supabase dans une prochaine version
            — vos données locales seront migrables.
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-white">
          <h2 className="text-2xl font-bold">Commencez maintenant</h2>
          <p className="mt-2 text-white/80">Ajoutez vos lots en 2 minutes, obtenez instantanément le plafond légal et le diagnostic énergétique.</p>
          <Link
            href={`${lp}/gestion-locative/portefeuille`}
            className="mt-5 inline-flex rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:bg-white/90"
          >
            Ouvrir mon portefeuille →
          </Link>
        </div>
      </section>
    </div>
  );
}
