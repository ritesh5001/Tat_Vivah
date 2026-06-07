import { env } from '../config/env.js';
import { ApiError } from '../errors/ApiError.js';

type Fast2SmsResponse = {
    return?: boolean;
    status?: boolean;
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

/**
 * Fast2SMS WhatsApp delivery.
 * Sends our own generated OTP code through an approved WhatsApp authentication
 * template (single body variable = the OTP code).
 *
 * GET https://www.fast2sms.com/dev/whatsapp
 *   ?authorization=<API_KEY>&message_id=<templateId>
 *   &phone_number_id=<wabaPhoneNumberId>&numbers=<10-digit>&variables_values=<code>
 */
class Fast2SmsWhatsAppService {
    async sendWhatsAppOtp(phone: string, otp: string): Promise<void> {
        if (!env.FAST2SMS_API_KEY) {
            throw ApiError.internal('Fast2SMS API key is not configured');
        }
        if (!env.FAST2SMS_WHATSAPP_MESSAGE_ID) {
            throw ApiError.internal('Fast2SMS WhatsApp template (message_id) is not configured');
        }
        if (!env.FAST2SMS_WHATSAPP_PHONE_NUMBER_ID) {
            throw ApiError.internal('Fast2SMS WhatsApp phone_number_id is not configured');
        }

        const normalizedPhone = normalizeIndianMobile(phone);
        if (!/^\d{10}$/.test(normalizedPhone)) {
            throw ApiError.badRequest('A valid 10-digit mobile number is required');
        }

        const params = new URLSearchParams({
            authorization: env.FAST2SMS_API_KEY,
            message_id: env.FAST2SMS_WHATSAPP_MESSAGE_ID,
            phone_number_id: env.FAST2SMS_WHATSAPP_PHONE_NUMBER_ID,
            numbers: normalizedPhone,
            variables_values: otp,
        });

        const response = await fetch(`${env.FAST2SMS_WHATSAPP_URL}?${params.toString()}`, {
            method: 'GET',
        });

        const data = await response.json().catch(() => null) as Fast2SmsResponse | null;
        const failed = !response.ok || data?.status === false || data?.return === false;
        if (failed) {
            const message = Array.isArray(data?.message)
                ? data.message.join(', ')
                : data?.message;
            throw ApiError.internal(message || 'Failed to send WhatsApp OTP');
        }
    }
}

export const fast2SmsWhatsAppService = new Fast2SmsWhatsAppService();
