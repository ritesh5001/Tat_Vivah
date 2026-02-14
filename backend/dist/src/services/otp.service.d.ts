export type SignupOtpPayload = {
    email: string;
    phone: string;
    passwordHash: string;
    role: 'USER' | 'SELLER';
    fullName?: string;
};
export declare class OtpService {
    sendEmailVerificationOtp(userId: string, email: string): Promise<void>;
    sendSignupOtp(payload: SignupOtpPayload): Promise<void>;
    verifyEmailOtp(email: string, code: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        userId: string | null;
        codeHash: string;
        purpose: import(".prisma/client").$Enums.OtpPurpose;
        expiresAt: Date;
        usedAt: Date | null;
        payload: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    getLatestSignupPayload(email: string): Promise<SignupOtpPayload | null>;
}
export declare const otpService: OtpService;
//# sourceMappingURL=otp.service.d.ts.map