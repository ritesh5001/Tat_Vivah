/**
 * Admin Validation
 * Zod schemas for admin API request validation
 */
import { z } from 'zod';
// ============================================================================
// SELLER MANAGEMENT
// ============================================================================
export const sellerIdParamSchema = z.object({
    id: z.string().min(1, 'Seller ID is required'),
});
// ============================================================================
// PRODUCT MODERATION
// ============================================================================
export const productIdParamSchema = z.object({
    id: z.string().min(1, 'Product ID is required'),
});
export const productRejectSchema = z.object({
    reason: z.string().min(1, 'Rejection reason is required').max(500),
});
export const productSetPriceSchema = z.object({
    adminListingPrice: z
        .number({ invalid_type_error: 'Admin listing price must be a number' })
        .positive('Admin listing price must be positive'),
});
// ============================================================================
// ORDER MANAGEMENT
// ============================================================================
export const orderIdParamSchema = z.object({
    id: z.string().min(1, 'Order ID is required'),
});
// ============================================================================
// AUDIT LOGS
// ============================================================================
export const auditLogQuerySchema = z.object({
    entityType: z.enum(['USER', 'PRODUCT', 'ORDER', 'PAYMENT']).optional(),
    entityId: z.string().optional(),
    actorId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});
//# sourceMappingURL=admin.validation.js.map