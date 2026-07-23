/**
 * GoKwik Client Configuration
 *
 * GoKwik Payment Links API — server-to-server payment collection.
 * Auth is a static app-id/app-secret header pair (no OAuth token dance),
 * so this module only resolves the environment base URL and credentials.
 *
 * Docs: GoKwik Payment Link API Integration Document v1.0
 */

import { env } from '../config/env.js';

const BASE_URLS = {
    SANDBOX: 'https://api-gw-v4.dev.gokwik.io/sandbox',
    PRODUCTION: 'https://gkx.gokwik.co',
} as const;

export function isGoKwikConfigured(): boolean {
    return Boolean(env.GOKWIK_APP_ID && env.GOKWIK_APP_SECRET);
}

export function getGoKwikBaseUrl(): string {
    return BASE_URLS[env.GOKWIK_ENV];
}

/** Auth headers required on every GoKwik API call. */
export function getGoKwikAuthHeaders(): Record<string, string> {
    return {
        'gk-app-id': env.GOKWIK_APP_ID ?? '',
        'gk-app-secret': env.GOKWIK_APP_SECRET ?? '',
        'Content-Type': 'application/json',
    };
}

if (!isGoKwikConfigured()) {
    console.warn('[GoKwik] Warning: GoKwik credentials not configured. GoKwik payments will not work.');
}
