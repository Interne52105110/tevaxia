import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { safeAuthReturnPath, authErrorPath } from "@/lib/auth-return";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const destination = safeAuthReturnPath(url.searchParams.get("next"));
  const redirect = (path: string) => {
    const response = NextResponse.redirect(new URL(path, url.origin));
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  };
  if (!code) return redirect(authErrorPath(destination, "no_code"));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return redirect(authErrorPath(destination, "not_configured"));
  try {
    const cookieStore = await cookies();
    // Stage writes until the exchange succeeds. Never swallow a cookie failure
    // or send a partially written authenticated response after an exchange error.
    const pending = new Map<string, { name: string; value: string; options: import("@supabase/ssr").CookieOptions }>();
    const client = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => {
          const merged = new Map(cookieStore.getAll().map(item => [item.name, item]));
          for (const item of pending.values()) merged.set(item.name, item);
          return [...merged.values()];
        },
        setAll: list => { for (const item of list) pending.set(item.name, item); },
      },
    });
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error || !data.session || !data.user) return redirect(authErrorPath(destination, "auth_failed"));
    const response = redirect(destination);
    try {
      for (const { name, value, options } of pending.values()) response.cookies.set({
        name, value, ...options, domain: ".tevaxia.lu", path: "/", sameSite: "lax", secure: true,
      });
    } catch { return redirect(authErrorPath(destination, "cookie_failed")); }
    return response;
  } catch { return redirect(authErrorPath(destination, "auth_failed")); }
}
