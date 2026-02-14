import { AuthRepository } from '../repositories/auth.repository.js';
import type { RegisterUserRequest, RegisterSellerRequest, RegisterAdminRequest, RegisterSuccessResponse, LoginResponse, TokenRefreshResponse, ListSessionsResponse, MessageResponse } from '@/types/auth.types.js';
/**
 * Auth Service
 * Contains all business logic for authentication
 * Testable and independent of HTTP layer
 */
export declare class AuthService {
    private readonly repository;
    constructor(repository: AuthRepository);
    private issueTokens;
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
    registerUser(data: RegisterUserRequest): Promise<RegisterSuccessResponse>;
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
    registerSeller(data: RegisterSellerRequest): Promise<RegisterSuccessResponse>;
    /**
     * Register a new ADMIN
     * POST /v1/auth/admin/register
     *
     * Business Rules:
     * 1. Check if email OR phone already exists
     * 2. Hash password
     * 3. Create user with role=ADMIN, status=ACTIVE
     */
    registerAdmin(data: RegisterAdminRequest): Promise<RegisterSuccessResponse>;
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
    login(identifier: string, password: string, userAgent?: string, ipAddress?: string): Promise<LoginResponse>;
    requestEmailOtp(email: string): Promise<{
        message: string;
    }>;
    verifyEmailOtp(email: string, code: string): Promise<LoginResponse | MessageResponse>;
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
    refreshTokens(refreshToken: string): Promise<TokenRefreshResponse>;
    /**
     * Logout current session
     * POST /v1/auth/logout
     *
     * Business Rules:
     * 1. Find matching session by userId and refresh token hash
     * 2. Delete the session
     * 3. Return success (idempotent - success even if session not found)
     */
    logout(userId: string, refreshToken?: string): Promise<MessageResponse>;
    /**
     * List all user sessions
     * GET /v1/auth/sessions
     */
    listSessions(userId: string): Promise<ListSessionsResponse>;
    /**
     * Revoke a specific session
     * DELETE /v1/auth/sessions/:sessionId
     */
    revokeSession(userId: string, sessionId: string): Promise<MessageResponse>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map