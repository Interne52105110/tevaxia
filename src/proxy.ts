import { NextRequest, NextResponse } from "next/server";

const ENERGY_HOST = "energy.tevaxia.lu";
const LOCALE_PREFIXES = ["en", "de", "pt", "lb"];

function getHost(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host") ||
    request.nextUrl.hostname ||
    ""
  ).replace(/:\d+$/, "");
}

function isEnergyHost(host: string): boolean {
  return host === ENERGY_HOST || host === "energy.localhost";
}

// Pages partagées qui existent à la racine et ne doivent PAS être réécrites vers /energy/
const SHARED_PAGES = ["/mentions-legales", "/confidentialite", "/plan-du-site", "/pricing", "/connexion", "/profil", "/mes-evaluations"];

function isSharedPage(pathname: string): boolean {
  return SHARED_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function proxy(request: NextRequest) {
  const host = getHost(request);
  const { pathname } = request.nextUrl;

  // Sous-domaine energy : réécrire vers /energy/...
  if (isEnergyHost(host)) {
    // Pages partagées → ne pas réécrire
    if (isSharedPage(pathname)) {
      const response = NextResponse.next();
      response.headers.set("x-url", pathname);
      response.headers.set("x-energy-subdomain", "1");
      return response;
    }

    // Déjà sous /energy → on laisse passer
    if (pathname.startsWith("/energy")) {
      const response = NextResponse.next();
      response.headers.set("x-url", pathname);
      response.headers.set("x-energy-subdomain", "1");
      return response;
    }

    // Detect locale prefix
    const localeMatch = LOCALE_PREFIXES.find(
      (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
    );

    if (localeMatch) {
      const rest = pathname.slice(localeMatch.length + 1); // strip /de
      // Shared pages with locale prefix → don't rewrite
      if (isSharedPage(rest)) {
        const response = NextResponse.next();
        response.headers.set("x-url", pathname);
        response.headers.set("x-energy-subdomain", "1");
        return response;
      }
      // e.g. /de/impact → /de/energy/impact
      const target = `/${localeMatch}/energy${rest === "/" || rest === "" ? "" : rest}`;
      const url = request.nextUrl.clone();
      url.pathname = target;
      const response = NextResponse.rewrite(url);
      response.headers.set("x-url", url.pathname);
      response.headers.set("x-energy-subdomain", "1");
      return response;
    }

    // Default locale (fr): /impact → /energy/impact
    if (!pathname.startsWith("/energy")) {
      const target = `/energy${pathname === "/" ? "" : pathname}`;
      const url = request.nextUrl.clone();
      url.pathname = target || "/energy";
      const response = NextResponse.rewrite(url);
      response.headers.set("x-url", url.pathname);
      response.headers.set("x-energy-subdomain", "1");
      return response;
    }

    const response = NextResponse.next();
    response.headers.set("x-url", pathname);
    response.headers.set("x-energy-subdomain", "1");
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("x-url", pathname);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|icon|favicon|.*\\..*).*)"],
};
