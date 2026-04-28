import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/dashboard", "bookings", "/profile", "/operator"];
const AUTH_ONLY = ["/login", "/signup"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get("session")?.value;
  
  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isAuthRoute = AUTH_ONLY.some(p => pathname.startsWith(p));

  if (!sessionCookie && isProtected) {
    const url = new URL("/auth/login", req.url);
    url.searchParams.set("returnUrl", pathname);
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