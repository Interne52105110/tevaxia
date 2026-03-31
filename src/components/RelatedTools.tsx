import Link from "next/link";

interface RelatedTool {
  href: string;
  title: string;
  description: string;
}

const TOOL_CATALOG: Record<string, RelatedTool> = {
  estimation: { href: "/estimation", title: "Estimation instantanée", description: "Estimez la valeur de votre bien" },
  frais: { href: "/frais-acquisition", title: "Frais d'acquisition", description: "Droits, Bëllegen Akt, TVA, notaire" },
  loyer: { href: "/calculateur-loyer", title: "Plafond de loyer", description: "Règle des 5% du capital investi" },
  aides: { href: "/simulateur-aides", title: "Simulateur d'aides", description: "5 couches d'aides cumulables" },
  plusValues: { href: "/plus-values", title: "Plus-values", description: "Spéculation, cession, exonération" },
  achatLocation: { href: "/achat-vs-location", title: "Acheter ou louer ?", description: "Comparez patrimoine et coûts" },
  valorisation: { href: "/valorisation", title: "Valorisation EVS", description: "8 méthodes professionnelles" },
  vefa: { href: "/vefa", title: "Calculateur VEFA", description: "Appels de fonds, intérêts intercalaires" },
  bancaire: { href: "/outils-bancaires", title: "Outils bancaires", description: "LTV, capacité, amortissement" },
  carte: { href: "/carte", title: "Carte des prix", description: "Prix par commune et quartier" },
};

export default function RelatedTools({ keys }: { keys: string[] }) {
  const tools = keys.map((k) => TOOL_CATALOG[k]).filter(Boolean);
  if (tools.length === 0) return null;

  return (
    <div className="mt-8 border-t border-card-border pt-8">
      <h3 className="text-sm font-semibold text-navy mb-4">Outils connexes</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href}
            className="rounded-xl border border-card-border bg-card p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="text-sm font-semibold text-navy">{tool.title}</div>
            <div className="mt-1 text-xs text-muted">{tool.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
