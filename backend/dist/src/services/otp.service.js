import { OtpPurpose } from '@prisma/client';
import { otpRepository } from '../repositories/otp.repository.js';
import { generateOtpCode, hashOtp } from '../utils/otp.util.js';
import { sendEmail } from '../notifications/email/resend.client.js';
import { ApiError } from '../errors/ApiError.js';
const OTP_EXPIRY_MINUTES = 10;
export class OtpService {
    async sendEmailVerificationOtp(userId, email) {
        if (!email) {
            throw ApiError.badRequest('Email is required for verification');
        }
        const code = generateOtpCode();
        const codeHash = hashOtp(code);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        await otpRepository.createOtp({
            userId,
            email,
            codeHash,
            purpose: OtpPurpose.EMAIL_VERIFY,
            expiresAt,
        });
        const html = `
            <div style="font-family:Arial,sans-serif; line-height:1.6;">
                <h2>Verify your TatVivah account</h2>
                <p>Your OTP is:</p>
                <p style="font-size:24px; font-weight:bold; letter-spacing:4px;">${code}</p>
                <p>This OTP expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
            </div>
        `;
        await sendEmail(email, 'Verify your TatVivah account', html);
    }
    async sendSignupOtp(payload) {
        if (!payload.email) {
            throw ApiError.badRequest('Email is required for verification');
        }
        const code = generateOtpCode();
        const codeHash = hashOtp(code);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        await otpRepository.createOtp({
            email: payload.email,
            codeHash,
            purpose: OtpPurpose.EMAIL_VERIFY,
            expiresAt,
            payload,
        });
        const html = `
            <div style="font-family:Arial,sans-serif; line-height:1.6;">
                <h2>Verify your TatVivah account</h2>
                <p>Your OTP is:</p>
                <p style="font-size:24px; font-weight:bold; letter-spacing:4px;">${code}</p>
                <p>This OTP expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
            </div>
        `;
        await sendEmail(payload.email, 'Verify your TatVivah account', html);
    }
    async verifyEmailOtp(email, code) {
        const otp = await otpRepository.findLatestValid(email, OtpPurpose.EMAIL_VERIFY);
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
    async getLatestSignupPayload(email) {
        const latest = await otpRepository.findLatestByEmail(email, OtpPurpose.EMAIL_VERIFY);
        if (!latest || !('payload' in latest) || !latest.payload) {
            return null;
        }
        return latest.payload;
    }
}
export const otpService = new OtpService();
//# sourceMappingURL=otp.service.js.map