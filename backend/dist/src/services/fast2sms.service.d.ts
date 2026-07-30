export declare function normalizeIndianMobile(input: string): string;
/**
 * Fast2SMS WhatsApp delivery.
 * Sends our own generated OTP code through an approved WhatsApp authentication
 * template (single body variable = the OTP code).
 *
 * GET https://www.fast2sms.com/dev/whatsapp
 *   ?authorization=<API_KEY>&message_id=<templateId>
 *   &phone_number_id=<wabaPhoneNumberId>&numbers=<10-digit>&variables_values=<code>
 */
declare class Fast2SmsWhatsAppService {
    sendWhatsAppOtp(phone: string, otp: string): Promise<void>;
}
export declare const fast2SmsWhatsAppService: Fast2SmsWhatsAppService;
export {};
//# sourceMappingURL=fast2sms.service.d.ts.map