import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/seller",
  "/admin",
  "/user",
  "/profile",
  "/checkout"
];

const authPages = ["/login", "/register", "/(auth)", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthPage = authPages.some((route) => pathname.startsWith(route));

  const accessToken = request.cookies.get("tatvivah_access")?.value;
  const role = request.cookies.get("tatvivah_role")?.value?.toUpperCase();

  const forceLogin = request.nextUrl.searchParams.get("force") === "1";

  if (isAuthPage && accessToken && role && !forceLogin) {
    const roleRedirects: Record<string, string> = {
      ADMIN: "/admin/dashboard",
      SUPER_ADMIN: "/admin/dashboard",
      SELLER: "/seller/dashboard",
      USER: "/user/dashboard",
    };
    return NextResponse.redirect(new URL(roleRedirects[role] ?? "/", request.url));
  }

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!accessToken || !role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/seller") && role !== "SELLER") {
    return NextResponse.redirect(new URL("/marketplace", request.url));
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/marketplace", request.url));
  }

  if (pathname.startsWith("/user") && role !== "USER") {
    return NextResponse.redirect(new URL("/marketplace", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/seller/:path*",
    "/admin/:path*",
    "/user/:path*",
    "/profile/:path*",
    "/login",
    "/register/:path*",
    "/forgot-password",
    "/reset-password",
    "/checkout"
  ],
};
