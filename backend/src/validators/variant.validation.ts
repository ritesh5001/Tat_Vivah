import { z } from 'zod';

/**
 * Create Variant Validation Schema
 * POST /v1/seller/products/:id/variants
 */
export const createVariantSchema = z.object({
    color: z
        .string()
        .trim()
        .min(1, 'Color must be at least 1 character')
        .max(50, 'Color must be at most 50 characters')
        .optional(),

    images: z
        .array(z.string().url('Variant image must be a valid URL'))
        .max(8, 'Maximum 8 variant images allowed')
        .optional(),

    sku: z
        .string()
        .min(1, 'SKU is required')
        .max(100, 'SKU must be at most 100 characters'),

    price: z
        .number()
        .positive('Price must be positive'),

    compareAtPrice: z
        .number()
        .positive('Compare at price must be positive')
        .optional(),

    initialStock: z
        .number()
        .int('Stock must be an integer')
        .min(0, 'Stock cannot be negative')
        .optional()
        .default(0),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>;

/**
 * Update Variant Validation Schema
 * PUT /v1/seller/variants/:id
 */
export const updateVariantSchema = z.object({
    color: z
        .string()
        .trim()
        .min(1, 'Color must be at least 1 character')
        .max(50, 'Color must be at most 50 characters')
        .nullable()
        .optional(),

    images: z
        .array(z.string().url('Variant image must be a valid URL'))
        .max(8, 'Maximum 8 variant images allowed')
        .optional(),

    price: z
        .number()
        .positive('Price must be positive')
        .optional(),

    compareAtPrice: z
        .number()
        .positive('Compare at price must be positive')
        .nullable()
        .optional(),
});

export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

/**
 * Update Stock Validation Schema
 * PUT /v1/seller/variants/:id/stock
 */
export const updateStockSchema = z.object({
    stock: z
        .number()
        .int('Stock must be an integer')
        .min(0, 'Stock cannot be negative'),
});

export type UpdateStockInput = z.infer<typeof updateStockSchema>;
