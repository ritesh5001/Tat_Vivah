import { authRepository } from '../repositories/auth.repository.js';
import { hashPassword, comparePassword, hashToken, compareToken } from '../utils/password.util.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import { ApiError } from '../errors/ApiError.js';
import { env } from '../config/env.js';
import ms from 'ms';
import { otpService } from './otp.service.js';
import { generateOtpCode, hashOtp } from '../utils/otp.util.js';
import { otpRepository } from '../repositories/otp.repository.js';
import { sendEmail } from '../notifications/email/resend.client.js';
import { OtpPurpose } from '@prisma/client';
/**
 * Auth Service
 * Contains all business logic for authentication
 * Testable and independent of HTTP layer
 */
export class AuthService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async issueTokens(user, userAgent, ipAddress) {
        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
        });
        const refreshTokenExpiryMs = ms(env.REFRESH_TOKEN_EXPIRY);
        const expiresAt = new Date(Date.now() + refreshTokenExpiryMs);
        // Generate a temporary session ID to embed in the refresh token
        // We create session with a placeholder, then update in one step
        const session = await this.repository.createSession({
            userId: user.id,
            refreshToken: '', // placeholder
            userAgent: userAgent ?? undefined,
            ipAddress: ipAddress ?? undefined,
            expiresAt,
        });
        const refreshToken = generateRefreshToken({
            userId: user.id,
            sessionId: session.id,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
        });
        // Hash and update the session in one call
        const hashedRefreshToken = await hashToken(refreshToken);
        await this.repository.updateSessionRefreshToken(session.id, hashedRefreshToken);
        return {
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified,
            },
            accessToken,
            refreshToken,
        };
    }
    /**
     * Register a new USER
     * POST /v1/auth/register
     *
     * Business Rules:
     * 1. Check if email OR phone already exists
     * 2. Hash password
     * 3. Create user with role=USER, status=ACTIVE
     * 4. No JWT generation, no auto-login
     */
    async registerUser(data) {
        // 1. Check if email or phone already exists
        const exists = await this.repository.existsByEmailOrPhone(data.email, data.phone);
        if (exists) {
            throw ApiError.conflict('Email or phone already in use');
        }
        // 2. Hash password
        const passwordHash = await hashPassword(data.password);
        // 3. Send OTP for signup (account will be created after verification)
        const payload = {
            email: data.email,
            phone: data.phone,
            passwordHash,
            role: 'USER',
            fullName: data.fullName,
        };
        await otpService.sendSignupOtp(payload);
        // 4. Return success message (no token, no auto-login)
        return {
            message: 'OTP sent to your email',
        };
    }
    /**
     * Register a new SELLER
     * POST /v1/seller/register
     *
     * Business Rules:
     * 1. Check if email OR phone already exists
     * 2. Hash password
     * 3. Create user with role=SELLER, status=PENDING
     * 4. No JWT generation, no auto-login
     * 5. Seller cannot login until approved
     */
    async registerSeller(data) {
        // 1. Check if email or phone already exists
        const exists = await this.repository.existsByEmailOrPhone(data.email, data.phone);
        if (exists) {
            throw ApiError.conflict('Email or phone already in use');
        }
        // 2. Hash password
        const passwordHash = await hashPassword(data.password);
        // 3. Send OTP for signup (account will be created after verification)
        const payload = {
            email: data.email,
            phone: data.phone,
            passwordHash,
            role: 'SELLER',
        };
        await otpService.sendSignupOtp(payload);
        // 4. Return success message (no token, pending approval)
        return {
            message: 'OTP sent to your email. Verify to complete seller registration.',
        };
    }
    /**
     * Register a new ADMIN
     * POST /v1/auth/admin/register
     *
     * Business Rules:
     * 1. Check if email OR phone already exists
     * 2. Hash password
     * 3. Create user with role=ADMIN, status=ACTIVE
     */
    async registerAdmin(data) {
        const phone = data.phone ?? '';
        if (phone) {
            const exists = await this.repository.existsByEmailOrPhone(data.email, phone);
            if (exists) {
                throw ApiError.conflict('Email or phone already in use');
            }
        }
        else {
            const existing = await this.repository.findUserByEmail(data.email);
            if (existing) {
                throw ApiError.conflict('Email already in use');
            }
        }
        const passwordHash = await hashPassword(data.password);
        await this.repository.createUser({
            email: data.email,
            phone: data.phone ?? '',
            passwordHash,
            role: 'ADMIN',
            status: 'ACTIVE',
            isEmailVerified: false,
            isPhoneVerified: false,
        }).catch((error) => {
            if (error?.code === 'P2002' || String(error?.message ?? '').includes('Unique constraint')) {
                throw ApiError.conflict('Email or phone already in use');
            }
            throw error;
        });
        return { message: 'Admin registered successfully' };
    }
    /**
     * Login user
     * POST /v1/auth/login
     *
     * Business Rules:
     * 1. Find user by email OR phone
     * 2. Verify password
     * 3. Check status (must be ACTIVE)
     * 4. Generate tokens
     * 5. Create login session with HASHED refresh token
     */
    async login(identifier, password, userAgent, ipAddress) {
        // 1. Find user by email OR phone
        const user = await this.repository.findByIdentifier(identifier);
        if (!user) {
            throw ApiError.unauthorized('User not found');
        }
        // 2. Verify password
        const isPasswordValid = await comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            throw ApiError.unauthorized('Invalid password');
        }
        // 3. Check status (must be ACTIVE)
        if (user.status !== 'ACTIVE') {
            throw ApiError.forbidden('Account not active');
        }
        if ((user.role === 'USER' || user.role === 'SELLER') && !user.isEmailVerified) {
            throw ApiError.forbidden('Email verification required');
        }
        // 4. Return response
        return this.issueTokens({
            id: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
        }, userAgent, ipAddress);
    }
    async requestEmailOtp(email) {
        const user = await this.repository.findUserByEmail(email);
        if (!user) {
            const payload = await otpService.getLatestSignupPayload(email);
            if (!payload) {
                throw ApiError.notFound('User not found');
            }
            await otpService.sendSignupOtp(payload);
            return { message: 'OTP sent to email' };
        }
        if (user.isEmailVerified) {
            return { message: 'Email already verified' };
        }
        await otpService.sendEmailVerificationOtp(user.id, user.email ?? email);
        return { message: 'OTP sent to email' };
    }
    async verifyEmailOtp(email, code) {
        const otp = await otpService.verifyEmailOtp(email, code);
        if (otp.userId) {
            const user = await this.repository.findUserById(otp.userId);
            if (!user) {
                throw ApiError.notFound('User not found');
            }
            const nextStatus = user.role === 'USER' && user.status === 'PENDING'
                ? 'ACTIVE'
                : user.status;
            if (user.role === 'SELLER' && user.status !== 'ACTIVE') {
                throw ApiError.forbidden('Seller approval pending');
            }
            const updated = await this.repository.updateUser(user.id, {
                status: nextStatus,
                isEmailVerified: true,
            });
            return this.issueTokens({
                id: updated.id,
                email: updated.email,
                phone: updated.phone,
                role: updated.role,
                status: updated.status,
                isEmailVerified: updated.isEmailVerified,
                isPhoneVerified: updated.isPhoneVerified,
            });
        }
        const payload = otp.payload;
        if (!payload) {
            throw ApiError.badRequest('Invalid or expired OTP');
        }
        const exists = await this.repository.existsByEmailOrPhone(payload.email, payload.phone);
        if (exists) {
            throw ApiError.conflict('Email or phone already in use');
        }
        const status = payload.role === 'SELLER' ? 'PENDING' : 'ACTIVE';
        const created = await this.repository.createUser({
            email: payload.email,
            phone: payload.phone,
            passwordHash: payload.passwordHash,
            role: payload.role,
            status,
            isEmailVerified: true,
            isPhoneVerified: false,
        }).catch((error) => {
            if (error?.code === 'P2002' || String(error?.message ?? '').includes('Unique constraint')) {
                throw ApiError.conflict('Email or phone already in use');
            }
            throw error;
        });
        if (created.role === 'SELLER') {
            return {
                message: 'Email verified. Seller account pending admin approval.',
            };
        }
        return this.issueTokens({
            id: created.id,
            email: created.email,
            phone: created.phone,
            role: created.role,
            status: created.status,
            isEmailVerified: created.isEmailVerified,
            isPhoneVerified: created.isPhoneVerified,
        });
    }
    /**
     * Refresh tokens with rotation
     * POST /v1/auth/refresh
     *
     * Business Rules:
     * 1. Verify refresh token JWT signature & expiry
     * 2. Extract userId from payload
     * 3. Find matching session by comparing token hash
     * 4. If not found → invalidate ALL user sessions (token reuse attack)
     * 5. Generate new tokens
     * 6. Update session with new hashed refresh token
     * 7. Return new tokens
     */
    async refreshTokens(refreshToken) {
        // 1. Verify refresh token JWT (throws if invalid/expired)
        const decoded = verifyRefreshToken(refreshToken);
        const { userId, sessionId } = decoded;
        // 2. Look up the specific session by ID (O(1) instead of O(N) bcrypt loop)
        const session = await this.repository.findSessionByIdAndUser(sessionId, userId);
        if (!session) {
            // No session found — potential token reuse attack
            await this.repository.deleteAllUserSessions(userId);
            throw ApiError.unauthorized('Invalid refresh token');
        }
        // 3. Compare refresh token hash (single bcrypt call instead of N)
        const isMatch = await compareToken(refreshToken, session.refreshToken);
        if (!isMatch) {
            await this.repository.deleteAllUserSessions(userId);
            throw ApiError.unauthorized('Invalid refresh token');
        }
        // Check session expiry
        if (session.expiresAt < new Date()) {
            await this.repository.deleteSession(session.id);
            throw ApiError.unauthorized('Refresh token has expired');
        }
        // 4. Get user data for new access token
        const user = await this.repository.findUserById(userId);
        if (!user) {
            await this.repository.deleteSession(session.id);
            throw ApiError.unauthorized('User not found');
        }
        // Check user status
        if (user.status !== 'ACTIVE') {
            await this.repository.deleteSession(session.id);
            throw ApiError.forbidden('Account not active');
        }
        // 5. Generate new tokens
        const newAccessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
        });
        const newRefreshToken = generateRefreshToken({
            userId: user.id,
            sessionId: sessionId,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
        });
        // 6. Hash new refresh token and update session
        const hashedNewRefreshToken = await hashToken(newRefreshToken);
        await this.repository.updateSessionRefreshToken(session.id, hashedNewRefreshToken);
        // 7. Return new tokens
        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }
    /**
     * Logout current session
     * POST /v1/auth/logout
     *
     * Business Rules:
     * 1. Find matching session by userId and refresh token hash
     * 2. Delete the session
     * 3. Return success (idempotent - success even if session not found)
     */
    async logout(userId, refreshToken) {
        if (refreshToken) {
            // Decode the JWT to get the sessionId, then delete that single session (O(1))
            try {
                const decoded = verifyRefreshToken(refreshToken);
                if (decoded.sessionId) {
                    await this.repository.deleteUserSession(userId, decoded.sessionId);
                }
            }
            catch {
                // Token may be expired/invalid; that's fine for logout — it's idempotent
            }
        }
        // Idempotent - always return success
        return { message: 'Logged out successfully' };
    }
    /**
     * List all user sessions
     * GET /v1/auth/sessions
     */
    async listSessions(userId) {
        const sessions = await this.repository.getSessionsForUser(userId);
        return {
            sessions: sessions.map(session => ({
                sessionId: session.id,
                userAgent: session.userAgent,
                ipAddress: session.ipAddress,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
            })),
        };
    }
    /**
     * Revoke a specific session
     * DELETE /v1/auth/sessions/:sessionId
     */
    async revokeSession(userId, sessionId) {
        const deleted = await this.repository.deleteUserSession(userId, sessionId);
        if (!deleted) {
            throw ApiError.notFound('Session not found');
        }
        return { message: 'Session revoked successfully' };
    }
    // ========================================================================
    // PASSWORD RESET FLOW
    // ========================================================================
    static PASSWORD_RESET_EXPIRY_MINUTES = 10;
    /**
     * Forgot Password — request a password-reset OTP
     * POST /v1/auth/forgot-password
     *
     * Security:
     *   - Generic success response regardless of whether the email exists,
     *     to prevent user-existence enumeration.
     *   - OTP is hashed (SHA-256) before storage.
     *   - Previous unused password-reset OTPs remain (only the latest valid
     *     one is checked during reset).
     */
    async forgotPassword(email) {
        const user = await this.repository.findUserByEmail(email);
        // Always return a generic message to avoid leaking user existence
        if (!user) {
            return { message: 'If an account with that email exists, an OTP has been sent.' };
        }
        const code = generateOtpCode();
        const codeHash = hashOtp(code);
        const expiresAt = new Date(Date.now() + AuthService.PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);
        await otpRepository.createOtp({
            userId: user.id,
            email,
            codeHash,
            purpose: OtpPurpose.PASSWORD_RESET,
            expiresAt,
        });
        const html = `
            <div style="font-family:Arial,sans-serif; line-height:1.6;">
                <h2>Reset your TatVivah password</h2>
                <p>Your password-reset OTP is:</p>
                <p style="font-size:24px; font-weight:bold; letter-spacing:4px;">${code}</p>
                <p>This OTP expires in ${AuthService.PASSWORD_RESET_EXPIRY_MINUTES} minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
            </div>
        `;
        await sendEmail(email, 'Reset your TatVivah password', html);
        return { message: 'If an account with that email exists, an OTP has been sent.' };
    }
    /**
     * Reset Password — verify OTP and set a new password
     * POST /v1/auth/reset-password
     *
     * Security:
     *   - Finds the latest valid (non-expired, non-used) PASSWORD_RESET OTP.
     *   - Compares the hashed OTP.
     *   - Hashes the new password with bcrypt.
     *   - Marks the OTP as used.
     *   - Invalidates ALL existing login sessions (force re-login).
     */
    async resetPassword(email, otp, newPassword) {
        // 1. Find latest valid password-reset OTP
        const otpRecord = await otpRepository.findLatestValid(email, OtpPurpose.PASSWORD_RESET);
        if (!otpRecord) {
            throw ApiError.badRequest('Invalid or expired OTP');
        }
        // 2. Compare hashed OTP
        const hashed = hashOtp(otp);
        if (otpRecord.codeHash !== hashed) {
            throw ApiError.badRequest('Invalid or expired OTP');
        }
        // 3. Look up the user
        const user = await this.repository.findUserByEmail(email);
        if (!user) {
            throw ApiError.badRequest('Invalid or expired OTP');
        }
        // 4. Hash new password and update
        const passwordHash = await hashPassword(newPassword);
        await this.repository.updateUser(user.id, { passwordHash });
        // 5. Mark OTP as used
        await otpRepository.markUsed(otpRecord.id);
        // 6. Invalidate all sessions → forces re-login everywhere
        await this.repository.deleteAllUserSessions(user.id);
        return { message: 'Password reset successfully. Please login with your new password.' };
    }
}
// Export singleton instance with default repository
export const authService = new AuthService(authRepository);
//# sourceMappingURL=auth.service.js.map