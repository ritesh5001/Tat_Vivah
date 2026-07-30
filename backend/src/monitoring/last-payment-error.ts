/**
 * In-memory record of the most recent checkout payment-initiation failure.
 *
 * Purely diagnostic: lets the gated /health/phonepe endpoint report why the
 * last real checkout's payment init failed, without needing server-log access.
 * Not persisted — cleared on restart.
 */

export interface LastPaymentError {
    at: string;
    provider: string;
    orderId: string;
    message: string;
    stack?: string | undefined;
}

let lastPaymentError: LastPaymentError | null = null;

export function recordLastPaymentError(err: Omit<LastPaymentError, 'at'>): void {
    lastPaymentError = { ...err, at: new Date().toISOString() };
}

export function getLastPaymentError(): LastPaymentError | null {
    return lastPaymentError;
}
