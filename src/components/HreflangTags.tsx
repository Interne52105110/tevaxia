"use client";

import { usePathname } from "next/navigation";

export default function HreflangTags() {
  const pathname = usePathname();
  const isEN = pathname.startsWith("/en");
  const pathWithoutLocale = isEN ? pathname.replace(/^\/en/, "") || "/" : pathname;

  const frUrl = `https://tevaxia.lu${pathWithoutLocale}`;
  const enUrl = `https://tevaxia.lu/en${pathWithoutLocale}`;

  return (
    <>
      <link rel="alternate" hrefLang="fr" href={frUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={frUrl} />
    </>
  );
}
