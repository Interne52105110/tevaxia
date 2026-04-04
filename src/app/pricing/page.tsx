import Link from "next/link";
import { getTranslations } from "next-intl/server";

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-navy/60 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

function InheritedSeparator({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-navy/40">
      <span className="h-px flex-1 bg-navy/10" />
      {label}
      <span className="h-px flex-1 bg-navy/10" />
    </li>
  );
}

export default async function Pricing() {
  const t = await getTranslations("pricing");

  const tiers = [
    {
      key: "free" as const,
      price: t("free.price"),
      priceNote: t("free.priceNote"),
      description: t("free.description"),
      features: [
        t("free.f1"),
        t("free.f2"),
        t("free.f3"),
        t("free.f4"),
        t("free.f5"),
        t("free.f6"),
        t("free.f7"),
      ],
      inherited: null,
      cta: t("free.cta"),
      href: "/estimation",
      highlight: false,
      badge: null,
    },
    {
      key: "account" as const,
      price: t("account.price"),
      priceNote: t("account.priceNote"),
      description: t("account.description"),
      inherited: t("account.inherited"),
      features: [
        t("account.f1"),
        t("account.f2"),
        t("account.f3"),
        t("account.f4"),
        t("account.f5"),
        t("account.f6"),
        t("account.f7"),
        t("account.f8"),
        t("account.f9"),
      ],
      cta: t("account.cta"),
      href: "/connexion",
      highlight: true,
      badge: t("account.badge"),
    },
    {
      key: "pro" as const,
      price: t("pro.price"),
      priceNote: t("pro.priceNote"),
      description: t("pro.description"),
      inherited: t("pro.inherited"),
      features: [
        t("pro.f1"),
        t("pro.f2"),
        t("pro.f3"),
        t("pro.f4"),
        t("pro.f5"),
        t("pro.f6"),
        t("pro.f7"),
        t("pro.f8"),
        t("pro.f9"),
      ],
      cta: t("pro.cta"),
      href: "mailto:contact@tevaxia.lu",
      highlight: false,
      badge: t("pro.badge"),
    },
  ];

  const faqs = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
  ];

  return (
    <div className="bg-background py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-3xl font-bold text-navy sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-muted max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid gap-8 lg:grid-cols-3 items-start">
          {tiers.map((tier) => (
            <div
              key={tier.key}
              className={`relative rounded-2xl border p-8 shadow-sm transition-shadow hover:shadow-md ${
                tier.highlight
                  ? "border-gold bg-gradient-to-b from-card to-gold/5 ring-2 ring-gold/40"
                  : "border-card-border bg-card"
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold tracking-wide ${
                    tier.highlight
                      ? "bg-gold text-white"
                      : "bg-navy/10 text-navy"
                  }`}
                >
                  {tier.badge}
                </span>
              )}

              {/* Tier name */}
              <h2 className="text-xl font-bold text-navy mt-1">
                {t(`${tier.key}.name`)}
              </h2>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-navy">
                  {tier.price}
                </span>
              </div>
              <p className="text-sm text-muted mt-1">{tier.priceNote}</p>

              {/* Description */}
              <p className="mt-3 text-sm text-slate">{tier.description}</p>

              {/* CTA */}
              <Link
                href={tier.href}
                className={`mt-6 block rounded-lg px-4 py-3 text-center text-sm font-semibold transition-colors ${
                  tier.highlight
                    ? "bg-navy text-white hover:bg-navy-light"
                    : "border border-card-border text-navy hover:bg-background"
                }`}
              >
                {tier.cta}
              </Link>

              {/* Features */}
              <ul className="mt-6 space-y-2.5">
                {tier.inherited && (
                  <InheritedSeparator label={tier.inherited} />
                )}
                {tier.features.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate"
                  >
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-navy text-center mb-8">
            {t("faq.title")}
          </h2>
          <dl className="space-y-6">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-card-border bg-card p-6"
              >
                <dt className="text-sm font-semibold text-navy">{faq.q}</dt>
                <dd className="mt-2 text-sm text-slate leading-relaxed">
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Contact footer */}
        <div className="mt-14 text-center text-sm text-muted">
          {t("contact")}{" "}
          <a
            href="mailto:contact@tevaxia.lu"
            className="text-navy hover:underline"
          >
            contact@tevaxia.lu
          </a>
        </div>
      </div>
    </div>
  );
}
