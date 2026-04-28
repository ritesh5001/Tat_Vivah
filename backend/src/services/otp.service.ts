import { OtpPurpose } from '@prisma/client';
import { otpRepository } from '../repositories/otp.repository.js';
import { generateOtpCode, hashOtp } from '../utils/otp.util.js';
import { ApiError } from '../errors/ApiError.js';
import { fast2SmsService, normalizeIndianMobile } from './fast2sms.service.js';
import { sendEmail } from '../notifications/email/resend.client.js';
import { renderBrandedEmail } from '../notifications/email/templates/layout.js';

const OTP_EXPIRY_MINUTES = 10;

export type SignupOtpPayload = {
    email: string;
    phone: string;
    whatsappNumber?: string;
    passwordHash: string;
    role: 'USER' | 'SELLER';
    fullName?: string;
};

export class OtpService {
    async sendPhoneOtp(userId: string, phone: string, _mode: 'login' | 'verify' = 'verify'): Promise<void> {
        const normalizedPhone = normalizeIndianMobile(phone);
        if (!/^\d{10}$/.test(normalizedPhone)) {
            throw ApiError.badRequest('A valid 10-digit mobile number is required');
        }

        const code = generateOtpCode();
        const codeHash = hashOtp(code);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await otpRepository.createOtp({
            userId,
            email: normalizedPhone,
            codeHash,
            purpose: OtpPurpose.EMAIL_VERIFY,
            expiresAt,
        });

        await fast2SmsService.sendOtp(normalizedPhone, code);
    }

    async sendEmailOtp(userId: string, email: string, mode: 'login' | 'verify' = 'login'): Promise<void> {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            throw ApiError.badRequest('Email address is required');
        }

        const code = generateOtpCode();
        const codeHash = hashOtp(code);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await otpRepository.createOtp({
            userId,
            email: normalizedEmail,
            codeHash,
            purpose: OtpPurpose.EMAIL_VERIFY,
            expiresAt,
        });

        const html = renderBrandedEmail({
            preheader: mode === 'login'
                ? 'Your TatVivah login code.'
                : 'Your TatVivah verification code.',
            eyebrow: mode === 'login' ? 'Login OTP' : 'Email Verification',
            title: mode === 'login' ? 'Complete Your Login' : 'Verify Your Email',
            message: [
                mode === 'login'
                    ? 'Use the one-time code below to sign in to your TatVivah account.'
                    : 'Use the one-time code below to verify your TatVivah email address.',
                `This code is valid for ${OTP_EXPIRY_MINUTES} minutes and can only be used once.`,
            ],
            details: [{ label: 'Verification Code', value: code }],
            accentText: 'For your security, never share this code with anyone.',
        });

        await sendEmail(normalizedEmail, mode === 'login' ? 'Your TatVivah login code' : 'Verify your TatVivah account', html);
    }

    async sendSignupOtp(payload: SignupOtpPayload): Promise<void> {
        const normalizedPhone = normalizeIndianMobile(payload.phone);
        if (!/^\d{10}$/.test(normalizedPhone)) {
            throw ApiError.badRequest('A valid 10-digit mobile number is required');
        }

        const code = generateOtpCode();
        const codeHash = hashOtp(code);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        await otpRepository.createOtp({
            email: normalizedPhone,
            codeHash,
            purpose: OtpPurpose.EMAIL_VERIFY,
            expiresAt,
            payload: {
                ...payload,
                phone: normalizedPhone,
            },
        });

        await fast2SmsService.sendOtp(normalizedPhone, code);
    }

    async verifyPhoneOtp(phone: string, code: string) {
        const normalizedPhone = normalizeIndianMobile(phone);
        const otp = await otpRepository.findLatestValid(normalizedPhone, OtpPurpose.EMAIL_VERIFY);
        if (!otp) {
            throw ApiError.badRequest('Invalid or expired OTP');
        }

        const hashed = hashOtp(code);
        if (otp.codeHash !== hashed) {
            throw ApiError.badRequest('Invalid or expired OTP');
        }

        await otpRepository.markUsed(otp.id);
        return otp;
    }

    async verifyEmailOtp(email: string, code: string) {
        const normalizedEmail = email.trim().toLowerCase();
        const otp = await otpRepository.findLatestValid(normalizedEmail, OtpPurpose.EMAIL_VERIFY);
        if (!otp) {
            throw ApiError.badRequest('Invalid or expired OTP');
        }

        const hashed = hashOtp(code);
        if (otp.codeHash !== hashed) {
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
