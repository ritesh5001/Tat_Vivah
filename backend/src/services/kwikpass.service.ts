/**
 * KwikPass Service
 *
 * KwikPass (GoKwik) provides phone + OTP login and SSO on the storefront.
 * The browser SDK performs the OTP exchange and hands the page a `kpToken`.
 *
 * That token is a **JWE** (encrypted, not merely signed) issued by GoKwik and
 * decrypted server-side with a shared secret. Decryption succeeding IS the
 * verification: only GoKwik can produce a token that decrypts with our key.
 * We therefore never trust a phone number sent from the client — only the one
 * recovered from inside the token.
 *
 * Docs: "KwikPass Integration Guide for Custom Headless Stores".
 */

import { base64url, jwtDecrypt } from 'jose';
import { env } from '../config/env.js';
import { ApiError } from '../errors/ApiError.js';
import { authLogger } from '../config/logger.js';

const logger = authLogger.child({ component: 'kwikpass-service' });

export interface KwikPassIdentity {
    /** 10-digit Indian mobile number recovered from the token. */
    phone: string;
    /** Optional, unauthenticated email supplied by the KwikPass network. */
    email: string | null;
}

export function isKwikPassConfigured(): boolean {
    return Boolean(env.KWIKPASS_JWE_SECRET);
}

/** Pull the first non-empty string from a set of candidate claim keys. */
function pickClaim(payload: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
        const value = payload[key];
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
        if (typeof value === 'number' && Number.isFinite(value)) {
            return String(value);
        }
    }
    return null;
}

export class KwikPassService {

    /**
     * Decrypt and validate a kpToken, returning the identity it asserts.
     *
     * Throws ApiError(401) on any failure — a token we cannot decrypt is a
     * token we cannot trust, so this fails closed by design.
     */
    async verifyToken(kpToken: string): Promise<KwikPassIdentity> {
        if (!isKwikPassConfigured()) {
            throw new ApiError(500, 'KwikPass is not configured');
        }
        if (!kpToken || typeof kpToken !== 'string') {
            throw new ApiError(400, 'kpToken is required');
        }

        let payload: Record<string, unknown>;
        try {
            // The shared secret is distributed base64url-encoded.
            const secret = base64url.decode(env.KWIKPASS_JWE_SECRET!);
            const result = await jwtDecrypt(kpToken, secret);
            payload = result.payload as Record<string, unknown>;
        } catch (error) {
            logger.warn(
                { event: 'kwikpass_token_decrypt_failed', error: error instanceof Error ? error.message : String(error) },
                'KwikPass token decryption failed',
            );
            throw new ApiError(401, 'Invalid KwikPass token');
        }

        // Claim names vary slightly across KwikPass versions; accept the
        // documented ones and fall back to common aliases.
        const rawPhone = pickClaim(payload, ['phone', 'phone_number', 'phoneNumber', 'mobile']);
        if (!rawPhone) {
            logger.warn({ event: 'kwikpass_token_missing_phone' }, 'KwikPass token has no phone claim');
            throw new ApiError(401, 'KwikPass token did not contain a phone number');
        }

        // Normalize to a bare 10-digit Indian mobile (tokens may carry +91/91).
        const phone = rawPhone.replace(/\D/g, '').slice(-10);
        if (phone.length !== 10) {
            logger.warn({ event: 'kwikpass_token_bad_phone' }, 'KwikPass token phone is not a 10-digit number');
            throw new ApiError(401, 'KwikPass token contained an invalid phone number');
        }

        const email = pickClaim(payload, ['email', 'email_id', 'emailId']);

        return { phone, email };
    }
}

export const kwikpassService = new KwikPassService();
