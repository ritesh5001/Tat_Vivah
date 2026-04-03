const LOCAL_SITE_FALLBACK = "http://localhost:3000";

function normalizeOrigin(url: string | undefined, fallback: string): string {
  const value = (url ?? "").trim();
  if (!value) return fallback;

  try {
    return new URL(value).origin;
  } catch {
    return fallback;
  }
}

function deriveCookieDomain(siteUrl: string): string {
  try {
    const hostname = new URL(siteUrl).hostname.toLowerCase();

    // Skip cookie domain for localhost/IP hosts.
    if (hostname === "localhost" || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
      return "";
    }

    return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  } catch {
    return "";
  }
}

export const SITE_URL = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL, LOCAL_SITE_FALLBACK);
export const SELLER_PORTAL_URL = normalizeOrigin(
  process.env.NEXT_PUBLIC_SELLER_PORTAL_URL,
  SITE_URL
);

export const SUPPORT_EMAIL = (process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@localhost")
  .trim();
export const SELLER_SUPPORT_EMAIL = (process.env.NEXT_PUBLIC_SELLER_SUPPORT_EMAIL ?? "seller@localhost")
  .trim();
export const PARTNERSHIP_EMAIL = (process.env.NEXT_PUBLIC_PARTNERSHIP_EMAIL ?? "partnerships@localhost")
  .trim();

const explicitCookieDomain = (process.env.NEXT_PUBLIC_COOKIE_DOMAIN ?? "")
  .trim()
  .replace(/^\./, "");

const effectiveCookieDomain = explicitCookieDomain || deriveCookieDomain(SITE_URL);

export const COOKIE_ATTRIBUTES_SUFFIX =
  process.env.NODE_ENV === "production"
    ? `${effectiveCookieDomain ? `; domain=.${effectiveCookieDomain}` : ""}; SameSite=Lax; Secure`
    : "";
