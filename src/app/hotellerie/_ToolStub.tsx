import Link from "next/link";
import { getLocale } from "next-intl/server";

interface ToolStubProps {
  title: string;
  subtitle: string;
  description: string;
  methodology: string[];
  inputs: string[];
  outputs: string[];
}

export async function ToolStub({ title, subtitle, description, methodology, inputs, outputs }: ToolStubProps) {
  const locale = await getLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 py-16">
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link
            href={`${lp}/hotellerie`}
            className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Retour au hub hôtellerie
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">{title}</h1>
          <p className="mt-3 text-lg text-white/70">{subtitle}</p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-amber-900">Outil en cours de finalisation</h2>
                <p className="mt-1 text-sm text-amber-800 leading-relaxed">
                  La version publique arrive prochainement. Si vous suivez une transaction concrète et
                  souhaitez un accompagnement ponctuel, contactez-nous — nous pouvons examiner votre dossier.
                </p>
                <a
                  href={`mailto:contact@tevaxia.lu?subject=${encodeURIComponent(title)}`}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
                >
                  Nous contacter
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-bold text-navy">À propos de cet outil</h2>
            <p className="mt-3 text-sm text-muted leading-relaxed">{description}</p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-card p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Méthodologie</h3>
              <ul className="mt-3 space-y-2 text-sm text-navy">
                {methodology.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Entrées attendues</h3>
              <ul className="mt-3 space-y-2 text-sm text-navy">
                {inputs.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Sorties produites</h3>
              <ul className="mt-3 space-y-2 text-sm text-navy">
                {outputs.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
