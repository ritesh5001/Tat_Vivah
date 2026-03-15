export type SubdomainType = "admin" | "seller" | "main";

/**
 * Detect the current subdomain from the browser hostname.
 * Returns "admin", "seller", or "main".
 */
export function getSubdomain(): SubdomainType {
  if (typeof window === "undefined") return "main";
  const hostname = window.location.hostname;
  if (hostname.startsWith("admin.")) return "admin";
  if (hostname.startsWith("seller.")) return "seller";
  return "main";
}

/** Roles allowed on each subdomain */
export const SUBDOMAIN_ALLOWED_ROLES: Record<SubdomainType, string[]> = {
  admin: ["ADMIN", "SUPER_ADMIN"],
  seller: ["SELLER"],
  main: ["USER"],
};

/** Map a role to its correct subdomain (null = main domain) */
export const ROLE_TO_SUBDOMAIN: Record<string, SubdomainType> = {
  ADMIN: "admin",
  SUPER_ADMIN: "admin",
  SELLER: "seller",
  USER: "main",
};

/**
 * Build the correct login URL for a given role based on the current hostname.
 * Handles both production subdomains and local development.
 */
export function getCorrectLoginUrl(role: string): string {
  if (typeof window === "undefined") return "/login";

  const { hostname, protocol, port } = window.location;
  const portSuffix = port ? `:${port}` : "";

  // Derive the base domain (strip existing subdomain prefix)
  let baseDomain = hostname;
  for (const sub of ["admin", "seller", "www"]) {
    if (hostname.startsWith(`${sub}.`)) {
      baseDomain = hostname.slice(sub.length + 1);
      break;
    }
  }

  const targetSub = ROLE_TO_SUBDOMAIN[role.toUpperCase()];

  if (!targetSub || targetSub === "main") {
    return `${protocol}//${baseDomain}${portSuffix}/login`;
  }
  return `${protocol}//${targetSub}.${baseDomain}${portSuffix}/login`;
}
