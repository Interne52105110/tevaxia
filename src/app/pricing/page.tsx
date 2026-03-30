import Link from "next/link";

const TIERS = [
  {
    name: "Gratuit",
    price: "0 €",
    period: "",
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
    cta: "Commencer gratuitement",
    href: "/estimation",
    highlight: false,
  },
  {
    name: "Pro",
    price: "29 €",
    period: "/ mois",
    description: "Pour les professionnels de l'immobilier",
    features: [
      "Tout le plan Gratuit",
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
    cta: "Essai gratuit 14 jours",
    href: "/connexion",
    highlight: true,
  },
  {
    name: "Expert",
    price: "99 €",
    period: "/ mois",
    description: "Pour les institutions et cabinets",
    features: [
      "Tout le plan Pro",
      "API REST (8 endpoints)",
      "Rapport PDF personnalisable",
      "Multi-utilisateurs (5 comptes)",
      "Audit trail complet",
      "Données marché commerciales",
      "Support prioritaire",
      "Intégration CRM sur demande",
    ],
    cta: "Nous contacter",
    href: "mailto:contact@tevaxia.lu",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <div className="bg-background py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Tarifs</h1>
          <p className="mt-3 text-muted">Gratuit pour commencer, Pro pour les professionnels</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
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
                <span className="text-3xl font-bold text-navy">{tier.price}</span>
                {tier.period && <span className="text-muted text-sm">{tier.period}</span>}
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
          <p>Tous les prix sont HT. Paiement par carte bancaire via Stripe.</p>
          <p className="mt-1">Annulation possible à tout moment. Questions ? <a href="mailto:contact@tevaxia.lu" className="text-navy hover:underline">contact@tevaxia.lu</a></p>
        </div>
      </div>
    </div>
  );
}
