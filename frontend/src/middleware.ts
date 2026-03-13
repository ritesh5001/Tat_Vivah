import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ──────────────────────────────────────────────────────────────────────────── */
/*  SELLER SUBDOMAIN ROUTING                                                  */
/*  Rewrites paths on seller.* hostname to /seller/* so Next.js resolves the  */
/*  existing (seller) route group. Auth pages are excluded from rewriting.    */
/* ──────────────────────────────────────────────────────────────────────────── */

/** The detected seller base path in the app router */
const SELLER_BASE = "/seller";

/** Pages that live at the root level and should NOT be prefixed on subdomain */
const ROOT_LEVEL_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
];

/**
 * Check whether the request is coming from the seller subdomain.
 * Works with both `seller.tatvivahtrends.com` and `seller.localhost:3000`.
 */
function isSellerSubdomain(host: string | null): boolean {
  if (!host) return false;
  // Strip port for comparison
  const hostname = host.split(":")[0];
  return hostname.startsWith("seller.");
}

/**
 * Check whether the path is a root-level page that should NOT get the
 * /seller prefix even on the seller subdomain.
 */
function isRootLevelPage(pathname: string): boolean {
  return ROOT_LEVEL_PAGES.some(
    (page) => pathname === page || pathname.startsWith(page + "/")
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  AUTH CONFIGURATION (unchanged)                                            */
/* ──────────────────────────────────────────────────────────────────────────── */

const protectedRoutes = [
  "/seller",
  "/admin",
  "/user",
  "/profile",
  "/checkout"
];

const authPages = ["/login", "/register", "/(auth)", "/forgot-password", "/reset-password"];

/* ──────────────────────────────────────────────────────────────────────────── */
/*  MIDDLEWARE                                                                */
/* ──────────────────────────────────────────────────────────────────────────── */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");

  /* ── STEP 1: Seller subdomain rewrite ──────────────────────────────────── */
  if (isSellerSubdomain(host)) {
    // Root of seller subdomain → redirect to seller dashboard
    if (pathname === "/") {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = `${SELLER_BASE}/dashboard`;
      return NextResponse.redirect(dashboardUrl);
    }

    // If path does NOT already start with /seller and is NOT a root-level page,
    // rewrite to /seller/<path> so Next.js resolves the (seller) route group.
    if (!pathname.startsWith(SELLER_BASE) && !isRootLevelPage(pathname)) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `${SELLER_BASE}${pathname}`;
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  /* ── STEP 2: Auth guards (existing logic, unchanged) ───────────────────── */
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

/* ──────────────────────────────────────────────────────────────────────────── */
/*  MATCHER                                                                   */
/*  Expanded to catch all paths (for subdomain rewrites) while excluding      */
/*  static assets, _next internals, API routes, and common static files.      */
/* ──────────────────────────────────────────────────────────────────────────── */

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api|images|favicon\\.ico|logo\\.png|tatvivah-logo\\.svg|og\\.png|robots\\.txt|sitemap\\.xml).*)",
  ],
};
