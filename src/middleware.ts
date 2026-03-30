import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  // Pass the URL to the i18n request config
  response.headers.set("x-url", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|icon|favicon|.*\\..*).*)"],
};
