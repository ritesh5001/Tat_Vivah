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
/*  ROLE–SUBDOMAIN ENFORCEMENT                                                */
/* ──────────────────────────────────────────────────────────────────────────── */

/** Which roles are permitted on each subdomain */
const SUBDOMAIN_ALLOWED_ROLES: Record<string, string[]> = {
  admin: ["ADMIN", "SUPER_ADMIN"],
  seller: ["SELLER"],
};

/** Map a role to the subdomain it belongs to (null = main domain) */
const ROLE_TO_SUBDOMAIN: Record<string, string | null> = {
  ADMIN: "admin",
  SUPER_ADMIN: "admin",
  SELLER: "seller",
  USER: null,
};

/** Dashboard path for each role */
const ROLE_DASHBOARD: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  SUPER_ADMIN: "/admin/dashboard",
  SELLER: "/seller/dashboard",
  USER: "/user/dashboard",
};

/** Which subdomain each register page is restricted to (null = main domain) */
const REGISTER_ALLOWED_SUBDOMAIN: Record<string, string | null> = {
  "/register/user": null,
  "/register/seller": "seller",
  "/register/admin": "admin",
};

/** Extract the base domain (without subdomain prefix) from a host string. */
function getBaseDomain(host: string): string {
  const hostname = host.split(":")[0];
  for (const sub of Object.keys(SUBDOMAIN_MAP)) {
    if (hostname.startsWith(`${sub}.`)) {
      return hostname.slice(sub.length + 1);
    }
  }
  if (hostname.startsWith("www.")) return hostname.slice(4);
  return hostname;
}

/** Build a URL pointing to a specific subdomain (or main domain if sub is null). */
function buildSubdomainUrl(
  targetSub: string | null,
  path: string,
  request: NextRequest
): URL {
  const host = request.headers.get("host") || "localhost:3000";
  const baseDomain = getBaseDomain(host);
  const portMatch = host.match(/:(\d+)$/);
  const port = portMatch ? `:${portMatch[1]}` : "";
  const proto = request.nextUrl.protocol;

  const targetHost = targetSub
    ? `${targetSub}.${baseDomain}${port}`
    : `${baseDomain}${port}`;

  return new URL(`${proto}//${targetHost}${path}`);
}

/** Check if a role is allowed on a given subdomain (null = main domain). */
function isRoleAllowedOnSubdomain(
  role: string,
  subPrefix: string | null
): boolean {
  if (!subPrefix) return role === "USER";
  return SUBDOMAIN_ALLOWED_ROLES[subPrefix]?.includes(role) ?? false;
}

/**
 * Whether the host supports cross-domain redirects.
 * Bare localhost / 127.0.0.1 cannot route subdomains, so skip.
 */
function canRedirectCrossDomain(host: string | null): boolean {
  if (!host) return false;
  const hostname = host.split(":")[0];
  return hostname !== "localhost" && hostname !== "127.0.0.1";
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  PORTAL ISOLATION                                                          */
/*  Public/shop pages are only available on the main domain.                  */
/*  Seller/admin subdomains may only access their own portal + auth pages.    */
/* ──────────────────────────────────────────────────────────────────────────── */

/** Paths that belong to the public storefront — blocked on seller/admin subdomains */
const PUBLIC_SHOP_PREFIXES = [
  "/marketplace",
  "/product",
  "/collections",
  "/blog",
  "/cart",
  "/checkout",
  "/search",
  "/vendors",
  "/occasion",
  "/reels",
  "/categories",
  "/user",
];

/** Check if a path is a public storefront page (including exact "/" root). */
function isPublicShopPage(pathname: string): boolean {
  return PUBLIC_SHOP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  AUTH CONFIGURATION                                                        */
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
  const crossDomain = canRedirectCrossDomain(host);

  if (subPrefix) {
    const basePath = SUBDOMAIN_MAP[subPrefix];

    // Root of subdomain → redirect to dashboard
    if (pathname === "/") {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = `${basePath}/dashboard`;
      return NextResponse.redirect(dashboardUrl);
    }

    // PORTAL ISOLATION: Block public storefront pages on seller/admin subdomains.
    // These pages only belong on the main domain.
    if (crossDomain && !isRootLevelPage(pathname) && isPublicShopPage(pathname)) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = `${basePath}/dashboard`;
      const response = NextResponse.redirect(dashboardUrl);
      response.headers.set("x-robots-tag", "noindex, nofollow");
      return response;
    }

    // PORTAL ISOLATION: On admin subdomain, block /seller/* paths.
    // On seller subdomain, block /admin/* paths.
    if (crossDomain) {
      if (subPrefix === "admin" && pathname.startsWith("/seller")) {
        const dashboardUrl = request.nextUrl.clone();
        dashboardUrl.pathname = "/admin/dashboard";
        const response = NextResponse.redirect(dashboardUrl);
        response.headers.set("x-robots-tag", "noindex, nofollow");
        return response;
      }
      if (subPrefix === "seller" && pathname.startsWith("/admin")) {
        const dashboardUrl = request.nextUrl.clone();
        dashboardUrl.pathname = "/seller/dashboard";
        const response = NextResponse.redirect(dashboardUrl);
        response.headers.set("x-robots-tag", "noindex, nofollow");
        return response;
      }
    }

    // If path does NOT already start with the base and is NOT a root-level page,
    // rewrite to /<base>/<path> so Next.js resolves the correct route group.
    if (!pathname.startsWith(basePath) && !isRootLevelPage(pathname)) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `${basePath}${pathname}`;
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  // PORTAL ISOLATION: On main domain, block /admin/* and /seller/* paths.
  if (!subPrefix && crossDomain) {
    if (pathname.startsWith("/admin") || pathname.startsWith("/seller")) {
      const response = NextResponse.redirect(new URL("/", request.url));
      return response;
    }
  }

  /* ── STEP 2: Register page subdomain enforcement ───────────────────────── */

  if (crossDomain) {
    for (const [regPath, allowedSub] of Object.entries(REGISTER_ALLOWED_SUBDOMAIN)) {
      if (pathname === regPath || pathname.startsWith(regPath + "/")) {
        if (subPrefix !== allowedSub) {
          return NextResponse.redirect(
            buildSubdomainUrl(allowedSub, regPath, request)
          );
        }
        break;
      }
    }
  }

  /* ── STEP 3: SESSION LOCK — role must match subdomain ────────────────────── */
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthPage = authPages.some((route) => pathname.startsWith(route));

  const accessToken = request.cookies.get("tatvivah_access")?.value;
  const role = request.cookies.get("tatvivah_role")?.value?.toUpperCase();

  const forceLogin = request.nextUrl.searchParams.get("force") === "1";

  /**
   * Hard lock: if an authenticated user is on the WRONG subdomain,
   * clear all auth cookies and redirect to the correct login page.
   * Skip on auth pages with ?force=1 to avoid redirect loops after logout.
   */
  if (crossDomain && accessToken && role && !forceLogin) {
    const roleAllowed = isRoleAllowedOnSubdomain(role, subPrefix);

    if (!roleAllowed) {
      // Build redirect to the correct portal's login
      const correctSub = ROLE_TO_SUBDOMAIN[role] ?? null;
      const loginUrl = buildSubdomainUrl(correctSub, "/login?force=1", request);
      const response = NextResponse.redirect(loginUrl);

      // Clear all auth cookies via Set-Cookie headers
      const cookieExpiry = "Thu, 01 Jan 1970 00:00:00 GMT";
      const cookieDomain = getBaseDomain(host || "");
      const clearOpts = `Path=/; Expires=${cookieExpiry}; Domain=.${cookieDomain}`;
      response.headers.append("Set-Cookie", `tatvivah_access=; ${clearOpts}`);
      response.headers.append("Set-Cookie", `tatvivah_refresh=; ${clearOpts}`);
      response.headers.append("Set-Cookie", `tatvivah_role=; ${clearOpts}`);
      response.headers.append("Set-Cookie", `tatvivah_user=; ${clearOpts}`);

      if (subPrefix) {
        response.headers.set("x-robots-tag", "noindex, nofollow");
      }
      return response;
    }
  }

  /* ── STEP 4: Auth guards ───────────────────────────────────────────────── */

  let response = NextResponse.next();

  if (isAuthPage && accessToken && role && !forceLogin) {
    /* Authenticated user on an auth page → send to their dashboard. */
    const correctSub = ROLE_TO_SUBDOMAIN[role] ?? null;
    const dashboard = ROLE_DASHBOARD[role] ?? "/";

    if (crossDomain && subPrefix !== correctSub) {
      // Wrong subdomain → redirect to correct subdomain's dashboard
      response = NextResponse.redirect(
        buildSubdomainUrl(correctSub, dashboard, request)
      );
    } else {
      // Correct subdomain (or localhost) → same-origin redirect
      response = NextResponse.redirect(new URL(dashboard, request.url));
    }
  } else if (!isProtected) {
    // Public / non-protected page → allow through
    response = NextResponse.next();
  } else if (!accessToken || !role) {
    // Protected route with no token → redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", pathname);
    response = NextResponse.redirect(loginUrl);
  } else if (crossDomain && subPrefix && !isRoleAllowedOnSubdomain(role, subPrefix)) {
    // Authenticated on a subdomain but wrong role → correct subdomain dashboard
    const correctSub = ROLE_TO_SUBDOMAIN[role] ?? null;
    const dashboard = ROLE_DASHBOARD[role] ?? "/";
    response = NextResponse.redirect(
      buildSubdomainUrl(correctSub, dashboard, request)
    );
  } else if (
    (pathname.startsWith("/seller") && role !== "SELLER") ||
    (pathname.startsWith("/admin") && role !== "ADMIN" && role !== "SUPER_ADMIN") ||
    (pathname.startsWith("/user") && role !== "USER")
  ) {
    // Wrong role for the route → redirect to correct place
    if (crossDomain) {
      const correctSub = ROLE_TO_SUBDOMAIN[role] ?? null;
      const dashboard = ROLE_DASHBOARD[role] ?? "/";
      response = NextResponse.redirect(
        buildSubdomainUrl(correctSub, dashboard, request)
      );
    } else {
      response = NextResponse.redirect(new URL("/marketplace", request.url));
    }
  }

  /* ── STEP 5: SEO Blocking for Subdomains ───────────────────────────────── */
  if (subPrefix) {
    response.headers.set("x-robots-tag", "noindex, nofollow");
  }

  return response;
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
