import { prisma } from '../config/db.js';
/**
 * Auth Repository
 * Handles all database operations for authentication
 * No business logic - only data access
 */
export class AuthRepository {
    /**
     * Find a user by their email address
     */
    async findUserByEmail(email) {
        return prisma.user.findUnique({
            where: { email },
        });
    }
    /**
     * Find a user by their phone number
     */
    async findUserByPhone(phone) {
        return prisma.user.findFirst({
            where: { phone },
        });
    }
    /**
     * Find a user by email OR phone (for login)
     */
    async findByIdentifier(identifier) {
        return prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { phone: identifier },
                ],
            },
        });
    }
    /**
     * Check if email or phone already exists
     */
    async existsByEmailOrPhone(email, phone) {
        const user = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { phone }],
            },
            select: { id: true },
        });
        return user !== null;
    }
    /**
     * Find a user by their ID
     */
    async findUserById(id) {
        return prisma.user.findUnique({
            where: { id },
        });
    }
    /**
     * Create a new user (no transaction needed for single create)
     */
    async createUser(data) {
        return prisma.user.create({
            data: {
                email: data.email,
                phone: data.phone,
                whatsappNumber: data.whatsappNumber ?? null,
                passwordHash: data.passwordHash,
                role: data.role,
                status: data.status,
                isEmailVerified: data.isEmailVerified,
                isPhoneVerified: data.isPhoneVerified,
            },
        });
    }
    /**
     * Update a user by ID
     */
    async updateUser(id, data) {
        return prisma.user.update({
            where: { id },
            data: {
                ...(data.email !== undefined && { email: data.email }),
                ...(data.phone !== undefined && { phone: data.phone }),
                ...(data.whatsappNumber !== undefined && { whatsappNumber: data.whatsappNumber }),
                ...(data.passwordHash !== undefined && { passwordHash: data.passwordHash }),
                ...(data.role !== undefined && { role: data.role }),
                ...(data.status !== undefined && { status: data.status }),
                ...(data.isEmailVerified !== undefined && { isEmailVerified: data.isEmailVerified }),
                ...(data.isPhoneVerified !== undefined && { isPhoneVerified: data.isPhoneVerified }),
            },
        });
    }
    /**
     * Create a new login session
     */
    async createSession(data) {
        return prisma.loginSession.create({
            data: {
                userId: data.userId,
                refreshToken: data.refreshToken,
                userAgent: data.userAgent ?? null,
                ipAddress: data.ipAddress ?? null,
                expiresAt: data.expiresAt,
            },
            select: { id: true },
        });
    }
    /**
     * Find a session by refresh token
     */
    async findSessionByRefreshToken(refreshToken) {
        return prisma.loginSession.findFirst({
            where: { refreshToken },
            select: { id: true, userId: true, expiresAt: true },
        });
    }
    /**
     * Delete a session by ID
     */
    async deleteSession(id) {
        await prisma.loginSession.delete({
            where: { id },
        });
    }
    /**
     * Delete all sessions for a user
     */
    async deleteAllUserSessions(userId) {
        await prisma.loginSession.deleteMany({
            where: { userId },
        });
    }
    /**
     * Update session with new refresh token
     */
    async updateSessionRefreshToken(sessionId, refreshToken) {
        await prisma.loginSession.update({
            where: { id: sessionId },
            data: { refreshToken },
        });
    }
    /**
     * Get all sessions for a user (for token rotation verification)
     */
    async findSessionsByUserId(userId) {
        return prisma.loginSession.findMany({
            where: { userId },
            select: { id: true, refreshToken: true, expiresAt: true },
        });
    }
    /**
     * Get all sessions for a user (for listing - safe fields only)
     */
    async getSessionsForUser(userId) {
        return prisma.loginSession.findMany({
            where: { userId },
            select: {
                id: true,
                userAgent: true,
                ipAddress: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Delete a session by ID only if it belongs to the user
     * Returns true if deleted, false if not found
     */
    async deleteUserSession(userId, sessionId) {
        const result = await prisma.loginSession.deleteMany({
            where: {
                id: sessionId,
                userId: userId,
            },
        });
        return result.count > 0;
    }
    /**
     * Check if a session exists for the given user
     */
    async findSessionByIdAndUser(sessionId, userId) {
        return prisma.loginSession.findFirst({
            where: {
                id: sessionId,
                userId: userId,
            },
            select: { id: true, refreshToken: true, expiresAt: true },
        });
    }
}
// Export singleton instance
export const authRepository = new AuthRepository();
//# sourceMappingURL=auth.repository.js.map