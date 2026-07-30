import {
  COOKIE_ATTRIBUTES_SUFFIX,
  COOKIE_ATTRIBUTES_SUFFIX_HOST_ONLY,
} from "@/lib/site-config";

/**
 * Set a cookie robustly, then verify it actually stuck.
 *
 * In production we scope cookies to `.<domain>` so they are shared across
 * subdomains. But if that domain doesn't match the host the app is served from
 * (misconfigured NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_COOKIE_DOMAIN, a preview
 * URL, a bare apex vs www mismatch, etc.), the browser SILENTLY DROPS the
 * cookie. The session then looks absent and the user is bounced to login in a
 * loop despite "logging in".
 *
 * To be resilient, we write with the domain-scoped attributes first, and if the
 * value is not readable afterwards, rewrite it as a host-only cookie (no
 * `domain=`), which is always accepted for the current host.
 */
export function setSessionCookie(
  name: string,
  value: string,
  maxAgeSeconds: number
): void {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}${COOKIE_ATTRIBUTES_SUFFIX}`;

  if (!readCookie(name)) {
    // Domain-scoped write was rejected — fall back to a host-only cookie.
    document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}${COOKIE_ATTRIBUTES_SUFFIX_HOST_ONLY}`;
  }
}

/** Read a cookie's decoded value, or null. */
export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/** Clear a cookie across BOTH domain-scoped and host-only variants. */
export function clearSessionCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0${COOKIE_ATTRIBUTES_SUFFIX}`;
  document.cookie = `${name}=; path=/; max-age=0${COOKIE_ATTRIBUTES_SUFFIX_HOST_ONLY}`;
}
