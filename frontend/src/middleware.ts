import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ──────────────────────────────────────────────────────────────────────────── */
/*  SUBDOMAIN ROUTING                                                         */
/*  Rewrites paths on <sub>.* hostnames to /<base>/* so Next.js resolves the  */
/*  existing route groups. Auth pages are excluded from rewriting.             */
/* ──────────────────────────────────────────────────────────────────────────── */

/** Subdomain → app-router base path mapping (detected from project structure) */
const SUBDOMAIN_MAP: Record<string, string> = {
  seller: "/seller",
  admin: "/admin",
};

/** Pages that live at the root level and should NOT be prefixed on subdomains */
const ROOT_LEVEL_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
];

/**
 * Extract the subdomain prefix from the Host header (e.g. "seller" or "admin").
 * Returns null when the request comes from the main domain or www.
 */
function getSubdomainPrefix(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0]; // strip port
  for (const sub of Object.keys(SUBDOMAIN_MAP)) {
    if (hostname.startsWith(`${sub}.`)) return sub;
  }
  return null;
}

/**
 * Check whether the path is a root-level page that should NOT get a
 * base-path prefix even on a subdomain.
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

  /* ── STEP 1: Subdomain rewrite (seller / admin) ────────────────────────── */
  const subPrefix = getSubdomainPrefix(host);

  if (subPrefix) {
    const basePath = SUBDOMAIN_MAP[subPrefix];

    // Root of subdomain → redirect to dashboard
    if (pathname === "/") {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = `${basePath}/dashboard`;
      return NextResponse.redirect(dashboardUrl);
    }

    // If path does NOT already start with the base and is NOT a root-level page,
    // rewrite to /<base>/<path> so Next.js resolves the correct route group.
    if (!pathname.startsWith(basePath) && !isRootLevelPage(pathname)) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `${basePath}${pathname}`;
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
