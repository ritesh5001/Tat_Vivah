import { apiRequest } from "./api";

/**
 * Shiprocket Checkout (Fastrr) — the express checkout.
 *
 * Fastrr's checkout is a browser bundle, so on mobile it runs inside a WebView
 * rather than natively. The app's only jobs are to mint a token with its own
 * authenticated session and to ask afterwards how the checkout ended — the same
 * two calls the web storefront makes.
 */

export interface FastrrSession {
  token: string;
  expiresAt: string;
  fastrrOrderId: string;
  sessionId: string;
  scriptUrl: string;
  styleUrl: string;
  redirectUrl: string;
  fallbackUrl: string;
}

export interface FastrrSessionStatus {
  status: "COMPLETED" | "PENDING" | "FAILED" | "UNKNOWN_SESSION";
  orderId: string | null;
  message: string;
}

export interface CheckoutConfig {
  provider: "FASTRR" | "NATIVE";
}

/**
 * Which checkout this build should show.
 *
 * Asked at runtime rather than compiled in, so turning express checkout off
 * reaches app versions already installed on buyers' phones without a release.
 */
export async function getCheckoutConfig(
  token?: string | null,
  signal?: AbortSignal
): Promise<CheckoutConfig> {
  return apiRequest<CheckoutConfig>("/v1/config/checkout", {
    method: "GET",
    token,
    signal,
  });
}

/** Mint a Fastrr access token for the cart, or a single buy-now variant. */
export async function createFastrrSession(
  input: { variantIds?: string[]; couponCode?: string },
  token?: string | null
): Promise<FastrrSession> {
  return apiRequest<FastrrSession>("/v1/fastrr/checkout/token", {
    method: "POST",
    // `mobileApp` tells Fastrr it is rendering inside an app shell, which
    // changes their overlay's chrome and disables redirects the WebView cannot
    // follow back.
    body: { ...input, mobileApp: true },
    token,
  });
}

/**
 * How the checkout ended.
 *
 * The backend asks Fastrr directly and places the order on the spot if it is
 * paid, so this resolves without waiting for the webhook.
 */
export async function getFastrrSessionStatus(
  sessionId: string,
  token?: string | null,
  signal?: AbortSignal
): Promise<FastrrSessionStatus> {
  return apiRequest<FastrrSessionStatus>(
    `/v1/fastrr/checkout/sessions/${encodeURIComponent(sessionId)}`,
    { method: "GET", token, signal }
  );
}

/**
 * The page loaded into the WebView.
 *
 * Built here rather than pointed at our own website on purpose: the storefront
 * requires a logged-in browser session, and the WebView has no cookies from the
 * app. This document carries the already-minted token instead, so it needs no
 * authentication at all — and contains nothing but Fastrr's own bundle.
 *
 * `baseUrl` matters: Fastrr's script is loaded over https, and Android WebViews
 * block mixed/opaque origins, so the document is given an https origin.
 */
export function buildFastrrCheckoutHtml(session: FastrrSession): string {
  // The token is injected as JSON so a stray quote can never break out of the
  // script and into executable markup.
  const payload = JSON.stringify({
    token: session.token,
    fallbackUrl: session.fallbackUrl,
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="${session.styleUrl}" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
  </style>
</head>
<body>
  <script>
    (function () {
      var config = ${payload};

      function post(message) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(message));
        }
      }

      function launch() {
        if (!window.HeadlessCheckout || !window.HeadlessCheckout.addToCart) {
          post({ type: "error", message: "Checkout failed to load" });
          return;
        }
        try {
          window.HeadlessCheckout.addToCart(
            new MouseEvent("click"),
            config.token,
            { fallbackUrl: config.fallbackUrl, isInitiatedFromApp: true }
          );
          post({ type: "opened" });
        } catch (err) {
          post({ type: "error", message: String((err && err.message) || err) });
        }
      }

      var script = document.createElement("script");
      script.src = "${session.scriptUrl}";
      script.async = true;
      script.onload = launch;
      // A failed bundle must report back rather than leaving the buyer on a
      // blank WebView with no way forward.
      script.onerror = function () {
        post({ type: "error", message: "Checkout failed to load" });
      };
      document.body.appendChild(script);
    })();
  </script>
</body>
</html>`;
}
