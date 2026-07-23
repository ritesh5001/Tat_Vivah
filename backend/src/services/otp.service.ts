import { OtpPurpose } from '@prisma/client';
import { otpRepository } from '../repositories/otp.repository.js';
import { generateOtpCode, hashOtp } from '../utils/otp.util.js';
import { ApiError } from '../errors/ApiError.js';
import { fast2SmsWhatsAppService, normalizeIndianMobile } from './fast2sms.service.js';
import { sendEmail } from '../notifications/email/resend.client.js';
import { renderBrandedEmail } from '../notifications/email/templates/layout.js';
import { authLogger } from '../config/logger.js';

const OTP_EXPIRY_MINUTES = 10;

type OtpContext = 'login' | 'verify' | 'signup' | 'reset';

/** Which channel an OTP was actually delivered through. */
export type OtpChannel = 'whatsapp' | 'email';

export type SignupOtpPayload = {
    email: string;
    phone: string;
    whatsappNumber?: string;
    passwordHash: string;
    role: 'USER' | 'SELLER';
    fullName?: string;
};

export class OtpService {
    private readonly logger = authLogger.child({ component: 'otp-service' });

    /**
     * Deliver an OTP code: WhatsApp (via Fast2SMS) primary, email fallback.
     * Falls back to email only when WhatsApp delivery fails AND a fallback
     * email address is available. Throws if neither channel succeeds.
     */
    private async deliverOtp(opts: {
        phone: string;
        code: string;
        context: OtpContext;
        fallbackEmail?: string | null | undefined;
    }): Promise<OtpChannel> {
        const normalizedPhone = normalizeIndianMobile(opts.phone);
        try {
            await fast2SmsWhatsAppService.sendWhatsAppOtp(normalizedPhone, opts.code);
            this.logger.info({ phone: normalizedPhone, context: opts.context }, 'whatsapp_otp_sent');
            return 'whatsapp';
        } catch (err) {
            this.logger.warn(
                { phone: normalizedPhone, context: opts.context, err: err instanceof Error ? err.message : String(err) },
                'whatsapp_otp_failed_fallback_email',
            );
            const fallbackEmail = opts.fallbackEmail?.trim().toLowerCase();
            if (!fallbackEmail) {
                // Neither channel is usable. Surface a clear error instead of
                // letting the caller report a false "OTP sent" success.
                throw ApiError.internal(
                    'We could not send your OTP right now. Please try again shortly.',
                );
            }
            const { subject, html } = this.renderOtpEmail(opts.code, opts.context);
            await sendEmail(fallbackEmail, subject, html);
            this.logger.info({ email: fallbackEmail, context: opts.context }, 'otp_email_fallback_sent');
            return 'email';
        }
    }

    private renderOtpEmail(code: string, context: OtpContext): { subject: string; html: string } {
        if (context === 'reset') {
            return {
                subject: 'Reset your TatVivah password',
                html: renderBrandedEmail({
                    preheader: 'Your password reset verification code for TatVivah.',
                    eyebrow: 'Password Recovery',
                    title: 'Reset Your Password',
                    message: [
                        'Use the one-time code below to reset your TatVivah account password.',
                        `This code expires in ${OTP_EXPIRY_MINUTES} minutes and can only be used once.`,
                    ],
                    details: [{ label: 'Reset Code', value: code }],
                    accentText: 'If you did not request this reset, you can safely ignore this email.',
                }),
            };
        }

        const isLogin = context === 'login';
        return {
            subject: isLogin ? 'Your TatVivah login code' : 'Verify your TatVivah account',
            html: renderBrandedEmail({
                preheader: isLogin ? 'Your TatVivah login code.' : 'Your TatVivah verification code.',
                eyebrow: isLogin ? 'Login OTP' : 'Account Verification',
                title: isLogin ? 'Complete Your Login' : 'Verify Your Account',
                message: [
                    isLogin
                        ? 'Use the one-time code below to sign in to your TatVivah account.'
                        : 'Use the one-time code below to verify your TatVivah account.',
                    `This code is valid for ${OTP_EXPIRY_MINUTES} minutes and can only be used once.`,
                ],
                details: [{ label: 'Verification Code', value: code }],
                accentText: 'For your security, never share this code with anyone.',
            }),
        };
    }

    /**
     * Send an OTP to an existing user's WhatsApp number (login / re-verify).
     * @param fallbackEmail address used only if WhatsApp delivery fails.
     */
    async sendPhoneOtp(
        userId: string,
        phone: string,
        fallbackEmail?: string | null,
        mode: 'login' | 'verify' = 'login',
    ): Promise<OtpChannel> {
        const normalizedPhone = normalizeIndianMobile(phone);
        if (!/^\d{10}$/.test(normalizedPhone)) {
            throw ApiError.badRequest('A valid 10-digit mobile number is required');
        }

        const code = generateOtpCode();
        const codeHash = hashOtp(code);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        this.logger.info({ userId, phone: normalizedPhone, mode }, 'phone_otp_create');

        await otpRepository.createOtp({
            userId,
            email: normalizedPhone,
            codeHash,
            purpose: OtpPurpose.EMAIL_VERIFY,
            expiresAt,
        });

        return this.deliverOtp({ phone: normalizedPhone, code, context: mode, fallbackEmail });
    }

    /**
     * Send a signup OTP. The OTP record is keyed by phone and carries the
     * pending account payload; the account is created on verification.
     * Delivered to WhatsApp with email fallback.
     */
    async sendSignupOtp(payload: SignupOtpPayload): Promise<void> {
        const normalizedPhone = normalizeIndianMobile(payload.phone);
        if (!/^\d{10}$/.test(normalizedPhone)) {
            throw ApiError.badRequest('A valid 10-digit mobile number is required');
        }

        const normalizedEmail = payload.email.trim().toLowerCase();

        const code = generateOtpCode();
        const codeHash = hashOtp(code);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        this.logger.info({ phone: normalizedPhone, role: payload.role, hasWhatsapp: Boolean(payload.whatsappNumber) }, 'signup_otp_create');

        await otpRepository.createOtp({
            email: normalizedPhone,
            codeHash,
            purpose: OtpPurpose.EMAIL_VERIFY,
            expiresAt,
            payload: {
                ...payload,
                email: normalizedEmail,
                phone: normalizedPhone,
            },
        });

        await this.deliverOtp({ phone: normalizedPhone, code, context: 'signup', fallbackEmail: normalizedEmail });
    }

    /**
     * Send a password-reset OTP keyed by phone (purpose PASSWORD_RESET).
     * Delivered to WhatsApp with email fallback.
     */
    async sendPasswordResetOtp(userId: string, phone: string, fallbackEmail?: string | null): Promise<void> {
        const normalizedPhone = normalizeIndianMobile(phone);
        if (!/^\d{10}$/.test(normalizedPhone)) {
            throw ApiError.badRequest('A valid 10-digit mobile number is required');
        }

        const code = generateOtpCode();
        const codeHash = hashOtp(code);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        this.logger.info({ userId, phone: normalizedPhone }, 'password_reset_otp_create');

        await otpRepository.createOtp({
            userId,
            email: normalizedPhone,
            codeHash,
            purpose: OtpPurpose.PASSWORD_RESET,
            expiresAt,
        });

        await this.deliverOtp({ phone: normalizedPhone, code, context: 'reset', fallbackEmail });
    }

    async verifyPhoneOtp(phone: string, code: string) {
        const normalizedPhone = normalizeIndianMobile(phone);
        const otp = await otpRepository.findLatestValid(normalizedPhone, OtpPurpose.EMAIL_VERIFY);
        if (!otp) {
            this.logger.warn({ phone: normalizedPhone }, 'phone_otp_not_found');
            throw ApiError.badRequest('Invalid or expired OTP');
        }

        const hashed = hashOtp(code);
        if (otp.codeHash !== hashed) {
            this.logger.warn({ phone: normalizedPhone }, 'phone_otp_invalid_code');
            throw ApiError.badRequest('Invalid or expired OTP');
        }

        await otpRepository.markUsed(otp.id);
        return otp;
    }

    async getLatestSignupPayload(phone: string): Promise<SignupOtpPayload | null> {
        const normalizedPhone = normalizeIndianMobile(phone);
        const latest = await otpRepository.findLatestByEmail(normalizedPhone, OtpPurpose.EMAIL_VERIFY);
        if (!latest || !('payload' in latest) || !latest.payload) {
            return null;
        }
        return latest.payload as SignupOtpPayload;
    }
}

export const otpService = new OtpService();
