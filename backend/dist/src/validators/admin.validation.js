/**
 * Admin Validation
 * Zod schemas for admin API request validation
 */
import { z } from 'zod';
import { updateProductSchema } from './product.validation.js';
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
const adminVariantUpdateSchema = z.object({
    id: z.string().min(1, 'Variant ID is required'),
    price: z
        .number({ invalid_type_error: 'Variant price must be a number' })
        .positive('Variant price must be positive')
        .optional(),
    compareAtPrice: z
        .number({ invalid_type_error: 'Compare-at price must be a number' })
        .nullable()
        .optional(),
    stock: z
        .number({ invalid_type_error: 'Stock must be a number' })
        .int('Stock must be an integer')
        .nonnegative('Stock must be zero or more')
        .optional(),
}).refine((value) => value.price !== undefined ||
    value.compareAtPrice !== undefined ||
    value.stock !== undefined, {
    message: 'Provide at least one field to update per variant',
});
export const adminProductUpdateSchema = updateProductSchema.extend({
    sellerPrice: z
        .number({ invalid_type_error: 'Seller price must be a number' })
        .positive('Seller price must be positive')
        .optional(),
    variants: z.array(adminVariantUpdateSchema).optional(),
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