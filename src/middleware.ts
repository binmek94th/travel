import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/dashboard", "/bookings", "/profile", "/operator"];
const AUTH_ONLY = ["/login", "/signup"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get("__session")?.value;

  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isAuthRoute = AUTH_ONLY.some(p => pathname.startsWith(p));

  // ❗ Only check existence, NOT validity
  if (!sessionCookie && isProtected) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};