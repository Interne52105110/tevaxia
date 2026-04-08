import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function APropos() {
  const t = await getTranslations("aPropos");

  return (
    <div className="bg-background py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
        </div>

        {/* Intro */}
        <section className="mb-10">
          <div className="rounded-2xl border border-card-border bg-card p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-navy-light text-white text-3xl font-bold">
                EB
              </div>
              <div>
                <h2 className="text-xl font-bold text-navy">{t("name")}</h2>
                <p className="mt-1 text-sm text-muted">{t("tagline")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-medium text-navy">REV TEGOVA</span>
                  <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-medium text-navy">TRV TEGOVA</span>
                  <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-medium text-navy">{t("badgeExpert")}</span>
                  <span className="rounded-full bg-navy/10 px-3 py-1 text-xs font-medium text-navy">{t("badgeNotexpert")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Parcours */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-navy mb-4">{t("parcoursTitle")}</h2>
          <div className="prose prose-sm text-slate max-w-none space-y-3">
            <p>{t("parcours1")}</p>
            <p>{t("parcours2")}</p>
            <p>{t("parcours3")}</p>
          </div>
        </section>

        {/* Chiffres clés */}
        <section className="mb-10">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { value: "16+", label: t("statAnnees") },
              { value: "1 500+", label: t("statEvaluations") },
              { value: "20+", label: t("statOutils") },
              { value: "5", label: t("statLangues") },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-card-border bg-card p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-navy">{s.value}</div>
                <div className="mt-1 text-xs text-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Formation */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-navy mb-4">{t("formationTitle")}</h2>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-navy" />
              <div>
                <div className="text-sm font-medium text-slate">{t("formationDU")}</div>
                <div className="text-xs text-muted">Panthéon-Assas (Paris II) — 2023</div>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-navy" />
              <div>
                <div className="text-sm font-medium text-slate">{t("formationESC")}</div>
                <div className="text-xs text-muted">ESC Bretagne, Brest — 2003-2004</div>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-navy" />
              <div>
                <div className="text-sm font-medium text-slate">{t("formationUBO")}</div>
                <div className="text-xs text-muted">Université de Bretagne Occidentale — 2002-2003</div>
              </div>
            </li>
          </ul>
        </section>

        {/* Projets */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-navy mb-4">{t("projetsTitle")}</h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-navy-dark font-bold text-sm">T</div>
                <h3 className="font-semibold text-navy">tevaxia.lu</h3>
              </div>
              <p className="text-sm text-slate">{t("projetTevaxia")}</p>
              <div className="mt-3">
                <Link href="/" className="text-sm font-medium text-navy hover:underline">{t("decouvrir")}</Link>
              </div>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-energy text-white font-bold text-sm">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-navy">energy.tevaxia.lu</h3>
              </div>
              <p className="text-sm text-slate">{t("projetEnergy")}</p>
              <div className="mt-3">
                <a href="https://energy.tevaxia.lu" className="text-sm font-medium text-navy hover:underline">{t("decouvrir")}</a>
              </div>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate text-white font-bold text-sm">BE</div>
                <h3 className="font-semibold text-navy">bargain-expertise.fr</h3>
              </div>
              <p className="text-sm text-slate">{t("projetBE")}</p>
              <div className="mt-3">
                <a href="https://bargain-expertise.fr" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-navy hover:underline">{t("visiter")}</a>
              </div>
            </div>
          </div>
        </section>

        {/* Approche */}
        <section className="mb-10">
          <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-white">
            <h2 className="text-lg font-semibold mb-3">{t("approcheTitle")}</h2>
            <p className="text-sm text-white/80 leading-relaxed">{t("approche")}</p>
            <p className="mt-4 text-sm text-white/50 italic">{t("citation")}</p>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-lg font-semibold text-navy mb-4">{t("contactTitle")}</h2>
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm space-y-2 text-sm text-slate">
            <p>
              <a href="https://www.linkedin.com/in/erwanbargain" target="_blank" rel="noopener noreferrer" className="text-navy hover:underline">LinkedIn</a>
              {" "}&mdash; linkedin.com/in/erwanbargain
            </p>
            <p>
              <a href="https://bargain-expertise.fr" target="_blank" rel="noopener noreferrer" className="text-navy hover:underline">bargain-expertise.fr</a>
              {" "}&mdash; {t("contactBE")}
            </p>
            <p>
              <a href="mailto:contact@tevaxia.lu" className="text-navy hover:underline">contact@tevaxia.lu</a>
              {" "}&mdash; {t("contactTevaxia")}
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
