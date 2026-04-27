import { env } from '../config/env.js';
import { ApiError } from '../errors/ApiError.js';

type Fast2SmsResponse = {
    return?: boolean;
    message?: string[] | string;
    request_id?: string;
};

export function normalizeIndianMobile(input: string): string {
    const digits = input.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
        return digits.slice(2);
    }
    return digits;
}

class Fast2SmsService {
    async sendOtp(phone: string, otp: string): Promise<void> {
        if (!env.FAST2SMS_API_KEY) {
            throw ApiError.internal('Fast2SMS API key is not configured');
        }

        const normalizedPhone = normalizeIndianMobile(phone);
        if (!/^\d{10}$/.test(normalizedPhone)) {
            throw ApiError.badRequest('A valid 10-digit mobile number is required');
        }

        const params = new URLSearchParams({
            authorization: env.FAST2SMS_API_KEY,
            route: 'otp',
            variables_values: otp,
            numbers: normalizedPhone,
        });

        const response = await fetch(`${env.FAST2SMS_BASE_URL}?${params.toString()}`, {
            method: 'POST',
        });

        const data = await response.json().catch(() => null) as Fast2SmsResponse | null;
        if (!response.ok || data?.return === false) {
            const message = Array.isArray(data?.message)
                ? data.message.join(', ')
                : data?.message;
            throw ApiError.internal(message || 'Failed to send OTP SMS');
        }
    }
}

export const fast2SmsService = new Fast2SmsService();
