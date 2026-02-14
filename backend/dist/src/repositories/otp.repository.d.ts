import { OtpPurpose } from '@prisma/client';
export declare class OtpRepository {
    createOtp(data: {
        userId?: string | null;
        email: string;
        codeHash: string;
        purpose: OtpPurpose;
        expiresAt: Date;
        payload?: Record<string, any> | null;
    }): Promise<{
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
    findLatestValid(email: string, purpose: OtpPurpose): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        userId: string | null;
        codeHash: string;
        purpose: import(".prisma/client").$Enums.OtpPurpose;
        expiresAt: Date;
        usedAt: Date | null;
        payload: import("@prisma/client/runtime/library").JsonValue | null;
    } | null>;
    findLatestByEmail(email: string, purpose: OtpPurpose): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        userId: string | null;
        codeHash: string;
        purpose: import(".prisma/client").$Enums.OtpPurpose;
        expiresAt: Date;
        usedAt: Date | null;
        payload: import("@prisma/client/runtime/library").JsonValue | null;
    } | null>;
    markUsed(id: string): Promise<{
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
}
export declare const otpRepository: OtpRepository;
//# sourceMappingURL=otp.repository.d.ts.map