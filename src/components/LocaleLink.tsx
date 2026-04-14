"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

const LOCALE_PREFIXES = ["en", "de", "pt", "lb"];

/**
 * Locale-aware Link component.
 * Automatically prefixes href with the current locale (detected from pathname).
 * French (default) has no prefix.
 *
 * Usage: <LocaleLink href="/estimation">...</LocaleLink>
 * On /en/* → renders <Link href="/en/estimation">
 * On /* (French) → renders <Link href="/estimation">
 */
export default function LocaleLink({ href, ...props }: ComponentProps<typeof Link>) {
  const pathname = usePathname();

  // Detect current locale prefix from pathname
  let localePrefix = "";
  for (const loc of LOCALE_PREFIXES) {
    if (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) {
      localePrefix = `/${loc}`;
      break;
    }
  }

  // Compute locale-aware href
  let localizedHref = href;
  if (localePrefix && typeof href === "string" && href.startsWith("/") && !href.startsWith(localePrefix)) {
    localizedHref = `${localePrefix}${href}`;
  }

  return <Link href={localizedHref} {...props} />;
}
