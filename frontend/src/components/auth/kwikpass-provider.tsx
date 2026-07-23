"use client";

/**
 * KwikPass SDK bootstrap.
 *
 * Per GoKwik's "KwikPass Integration Guide for Custom Headless Stores":
 *   1. `window.merchantInfo` must be set BEFORE any KwikPass script loads,
 *      and must be present on every page.
 *   2. The SDK is then loaded from the environment-specific CDN.
 *   3. `kwikpass-sso` fires when a returning shopper is recognised.
 *
 * Mount this once in the root layout.
 */

import * as React from "react";
import Script from "next/script";

const MERCHANT_ID = process.env.NEXT_PUBLIC_KWIKPASS_MERCHANT_ID ?? "";
const ENVIRONMENT =
  process.env.NEXT_PUBLIC_KWIKPASS_ENVIRONMENT === "production"
    ? "production"
    : "sandbox";

const SDK_HOST =
  ENVIRONMENT === "production"
    ? "https://pdp.gokwik.co"
    : "https://sandbox.pdp.gokwik.co";

export const KWIKPASS_SDK_URL = `${SDK_HOST}/kwikpass/plugin/build/kp-custom-merchant.js`;

export function isKwikPassEnabled(): boolean {
  return Boolean(MERCHANT_ID);
}

export function KwikPassProvider() {
  if (!isKwikPassEnabled()) {
    return null;
  }

  return (
    <>
      {/*
        merchantInfo must exist BEFORE the SDK script runs. A plain inline
        <script> executes during hydration-time render, ahead of the
        afterInteractive SDK below — next/script's beforeInteractive strategy
        is not supported outside _document in the App Router.
      */}
      <script
        id="kwikpass-merchant-info"
        dangerouslySetInnerHTML={{
          __html: `
            window.merchantInfo = {
              ...(window.merchantInfo || {}),
              mid: ${JSON.stringify(MERCHANT_ID)},
              environment: ${JSON.stringify(ENVIRONMENT)},
              type: "merchantInfo",
              integrationType: "CUSTOM_HEADLESS"
            };
            window.__KP_LOGIN_SDK_INSTANCE__ = window.__KP_LOGIN_SDK_INSTANCE__ || {};
            window.__KP_LOGIN_SDK_INSTANCE__.logEvents =
              window.__KP_LOGIN_SDK_INSTANCE__.logEvents ||
              function (event) {
                window.kpqueue = window.kpqueue || [];
                window.kpqueue.push(event);
              };
          `,
        }}
      />

      <Script
        id="kwikpass-sdk"
        src={KWIKPASS_SDK_URL}
        strategy="afterInteractive"
        onLoad={() => {
          window.dispatchEvent(new CustomEvent("kp-script-loaded"));
        }}
      />
    </>
  );
}
