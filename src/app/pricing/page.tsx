import Link from "next/link";

const TIERS = [
  {
    name: "Essentiel",
    oldPrice: null,
    price: "Gratuit",
    description: "Tous les calculateurs de base",
    features: [
      "Estimation instantanée",
      "Carte des prix",
      "Capital investi & loyer",
      "Frais d'acquisition",
      "Plus-values",
      "Simulateur d'aides",
      "Outils bancaires",
      "Acheter ou louer",
      "Données marché par commune",
    ],
    cta: "Commencer",
    href: "/estimation",
    highlight: false,
  },
  {
    name: "Pro",
    oldPrice: "29 €/mois",
    price: "Gratuit",
    description: "Pour les professionnels de l'immobilier",
    features: [
      "Tout le plan Essentiel",
      "Valorisation EVS 2025 (8 méthodes)",
      "DCF multi-locataires",
      "Bilan promoteur",
      "Rapport PDF professionnel",
      "Analyse narrative automatique",
      "Sauvegarde cloud illimitée",
      "Portfolio multi-actifs",
      "Section ESG / durabilité",
      "Checklist conformité EVS",
    ],
    cta: "Accéder gratuitement",
    href: "/valorisation",
    highlight: true,
  },
  {
    name: "Expert",
    oldPrice: "99 €/mois",
    price: "Gratuit",
    description: "Pour les institutions et cabinets",
    features: [
      "Tout le plan Pro",
      "API REST (8 endpoints)",
      "Données marché commerciales",
      "Bureaux, commerces, hôtels, logistique",
      "Support par email",
    ],
    cta: "Accéder gratuitement",
    href: "/valorisation",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <div className="bg-background py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-4">
          <span className="inline-block rounded-full bg-gold/20 px-4 py-1 text-sm font-semibold text-gold-dark mb-4">
            Phase de lancement — tout est gratuit
          </span>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Fonctionnalités</h1>
          <p className="mt-3 text-muted">Tous les outils sont accessibles gratuitement pendant la phase de test</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mt-10">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-8 shadow-sm ${
                tier.highlight
                  ? "border-gold bg-gradient-to-b from-card to-gold/5 ring-2 ring-gold/30"
                  : "border-card-border bg-card"
              }`}
            >
              {tier.highlight && (
                <span className="inline-block rounded-full bg-gold px-3 py-0.5 text-xs font-semibold text-navy-dark mb-4">
                  Recommandé
                </span>
              )}
              <h2 className="text-xl font-bold text-navy">{tier.name}</h2>
              <div className="mt-2">
                {tier.oldPrice && (
                  <span className="text-lg text-muted line-through mr-2">{tier.oldPrice}</span>
                )}
                <span className="text-3xl font-bold text-success">{tier.price}</span>
              </div>
              <p className="mt-2 text-sm text-muted">{tier.description}</p>

              <Link
                href={tier.href}
                className={`mt-6 block rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors ${
                  tier.highlight
                    ? "bg-navy text-white hover:bg-navy-light"
                    : "border border-card-border text-navy hover:bg-background"
                }`}
              >
                {tier.cta}
              </Link>

              <ul className="mt-6 space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate">
                    <svg className="h-4 w-4 shrink-0 text-success mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted">
          <p>Toutes les fonctionnalités sont gratuites pendant la phase de lancement.</p>
          <p className="mt-1">Questions ou suggestions ? <a href="mailto:contact@tevaxia.lu" className="text-navy hover:underline">contact@tevaxia.lu</a></p>
        </div>
      </div>
    </div>
  );
}
