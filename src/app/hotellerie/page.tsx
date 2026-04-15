import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "Outils pré-acquisition hôtelière | tevaxia.lu",
  description:
    "6 outils gratuits pour acheteurs et investisseurs hôteliers : valorisation RevPAR/EBITDA, DSCR, bilan d'exploitation, rénovation énergétique, score E-2. Alternative accessible à ARGUS.",
};

interface HotelTool {
  href: string;
  title: string;
  description: string;
  status: "ready" | "soon";
  icon: React.ReactNode;
  color: string;
}

const TOOLS: HotelTool[] = [
  {
    href: "/hotellerie/valorisation",
    title: "Valorisation hôtelière",
    description:
      "RevPAR, ADR, taux d'occupation, EBITDA, multiple de transaction. Approche par le revenu (DCF) + comparables.",
    status: "soon",
    color: "from-purple-700 to-purple-500",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m4.5-6h1.5m-1.5 3h1.5m-1.5 3h1.5M9 21v-3.375c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
  {
    href: "/hotellerie/dscr",
    title: "DSCR & financement",
    description:
      "Couverture du service de la dette pour acquisition hôtelière. Stress test occupation, ratio LTV, taux SBA / banque commerciale.",
    status: "soon",
    color: "from-blue-700 to-blue-500",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75M21 6v9.75c0 .621-.504 1.125-1.125 1.125H21M3 21h18M12 12.75a3 3 0 100-6 3 3 0 000 6z" />
      </svg>
    ),
  },
  {
    href: "/hotellerie/exploitation",
    title: "Bilan d'exploitation",
    description:
      "P&L hôtelier prévisionnel : USALI flash, ratios staff/revenu, departmental profit, GOP, FF&E reserve.",
    status: "soon",
    color: "from-emerald-700 to-emerald-500",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5" />
      </svg>
    ),
  },
  {
    href: "/hotellerie/renovation",
    title: "Rénovation énergétique hôtel",
    description:
      "Coûts par chambre, ROI sur factures énergie, impact RevPAR (label éco), aides Klimabonus appliquées au tertiaire.",
    status: "soon",
    color: "from-green-700 to-green-500",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    href: "/hotellerie/revpar-comparison",
    title: "RevPAR vs marché",
    description:
      "Benchmark RevPAR/ADR vs concurrence locale (STR-like). Identification du fair share (MPI, ARI, RGI).",
    status: "soon",
    color: "from-orange-700 to-orange-500",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    href: "/hotellerie/score-e2",
    title: "Score E-2 / investisseur",
    description:
      "Évaluation de l'éligibilité visa investisseur E-2 (US) : capital substantiel, création d'emplois, ratio risk/return.",
    status: "soon",
    color: "from-rose-700 to-rose-500",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
];

export default async function HotellerieHub() {
  const locale = await getLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 py-20 sm:py-24">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
            Nouveau module — gratuit
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Pré-acquisition hôtelière
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg leading-8 text-white/80">
            6 outils pour évaluer une acquisition hôtelière : valorisation RevPAR/EBITDA, DSCR, bilan
            d&apos;exploitation, rénovation énergétique, benchmark marché, score visa E-2. Une alternative
            accessible aux outils institutionnels (ARGUS, HVS) à $10k+/an.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-white/60">
            <span className="rounded-full border border-white/20 px-3 py-1">USALI</span>
            <span className="rounded-full border border-white/20 px-3 py-1">RevPAR / ADR</span>
            <span className="rounded-full border border-white/20 px-3 py-1">DSCR / LTV</span>
            <span className="rounded-full border border-white/20 px-3 py-1">Visa E-2</span>
            <span className="rounded-full border border-white/20 px-3 py-1">Klimabonus tertiaire</span>
          </div>
        </div>
      </section>

      {/* Tools grid */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={`${lp}${tool.href}`}
                className="group relative flex flex-col rounded-2xl border border-card-border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                {tool.status === "soon" && (
                  <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    Bientôt
                  </span>
                )}
                <div
                  className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${tool.color} text-white shadow-sm`}
                >
                  {tool.icon}
                </div>
                <h3 className="text-lg font-semibold text-navy group-hover:text-navy-light transition-colors">
                  {tool.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{tool.description}</p>
                <div className="mt-4 flex items-center justify-end">
                  <svg
                    className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-navy"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="border-t border-card-border bg-card py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">Pour qui ?</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-background p-6">
              <div className="text-3xl">🏨</div>
              <h3 className="mt-3 text-base font-semibold text-navy">Acheteurs de motels &amp; hôtels budget</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Vous regardez une transaction sous 5 M€ et n&apos;avez pas accès aux outils institutionnels.
                Faites une offre éclairée en quelques heures.
              </p>
            </div>
            <div className="rounded-xl border border-card-border bg-background p-6">
              <div className="text-3xl">🇺🇸</div>
              <h3 className="mt-3 text-base font-semibold text-navy">Investisseurs visa E-2</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                L&apos;acquisition d&apos;un hôtel/motel reste une voie privilégiée pour le visa E-2 US.
                Vérifiez l&apos;éligibilité avant d&apos;engager des frais.
              </p>
            </div>
            <div className="rounded-xl border border-card-border bg-background p-6">
              <div className="text-3xl">🔄</div>
              <h3 className="mt-3 text-base font-semibold text-navy">Marchands de biens hôteliers</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Repositionnement, rénovation, revente. Quantifiez le potentiel de création de valeur
                avant signature.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 sm:p-12">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">Soyez prévenu de la sortie</h2>
                <p className="mt-4 text-white/70 leading-relaxed">
                  Les 6 outils sont en cours de développement. Si vous suivez une transaction et avez
                  besoin d&apos;une analyse rapide, écrivez-nous : nous pouvons traiter votre cas en
                  beta-test.
                </p>
                <a
                  href="mailto:contact@tevaxia.lu?subject=Outils%20h%C3%B4tellerie%20-%20beta"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy-dark shadow-sm transition-colors hover:bg-gold-light"
                >
                  contact@tevaxia.lu
                </a>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-white/10 px-4 py-3">
                  <div className="text-sm font-medium text-white">Différenciateur mondial</div>
                  <p className="mt-1 text-sm text-white/60">
                    ARGUS Enterprise et HVS coûtent 10 000 $+/an. Aucun outil accessible n&apos;existe
                    actuellement pour les budgets &lt; 5 M€.
                  </p>
                </div>
                <div className="rounded-lg bg-white/10 px-4 py-3">
                  <div className="text-sm font-medium text-white">Standards utilisés</div>
                  <p className="mt-1 text-sm text-white/60">
                    USALI 11e éd. (Uniform System of Accounts for the Lodging Industry), méthode du
                    revenu (DCF), comparables transactionnels.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
