import { OtpPurpose } from '@prisma/client';
import { otpRepository } from '../repositories/otp.repository.js';
import { generateOtpCode, hashOtp } from '../utils/otp.util.js';
import { ApiError } from '../errors/ApiError.js';
import { fast2SmsService, normalizeIndianMobile } from './fast2sms.service.js';

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
    async sendPhoneVerificationOtp(userId: string, phone: string): Promise<void> {
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
