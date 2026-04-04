import { z } from 'zod';
/**
 * Create Product Validation Schema
 * POST /v1/seller/products
 */
export const createProductSchema = z.object({
    categoryId: z
        .string()
        .min(1, 'Category ID is required'),
    title: z
        .string()
        .min(3, 'Title must be at least 3 characters')
        .max(255, 'Title must be at most 255 characters'),
    sellerPrice: z
        .number({ invalid_type_error: 'Seller price must be a number' })
        .positive('Seller price must be positive'),
    description: z
        .string()
        .max(2000, 'Description must be at most 2000 characters')
        .optional(),
    images: z
        .array(z.string().url('Image must be a valid URL'))
        .min(1, 'At least one product image is required')
        .max(5, 'Maximum 5 images allowed')
        .optional(),
    isPublished: z
        .boolean()
        .optional()
        .default(false),
    occasionIds: z
        .array(z.string().min(1))
        .optional(),
});
/**
 * Update Product Validation Schema
 * PUT /v1/seller/products/:id
 */
export const updateProductSchema = z.object({
    categoryId: z
        .string()
        .min(1, 'Category ID is required')
        .optional(),
    title: z
        .string()
        .min(3, 'Title must be at least 3 characters')
        .max(255, 'Title must be at most 255 characters')
        .optional(),
    description: z
        .string()
        .max(2000, 'Description must be at most 2000 characters')
        .optional(),
    images: z
        .array(z.string().url('Image must be a valid URL'))
        .min(1, 'At least one product image is required')
        .max(5, 'Maximum 5 images allowed')
        .optional(),
    isPublished: z
        .boolean()
        .optional(),
    occasionIds: z
        .array(z.string().min(1))
        .optional(),
});
/**
 * Product Query Validation Schema
 * GET /v1/products
 */
export const productQuerySchema = z.object({
    page: z
        .string()
        .transform(Number)
        .pipe(z.number().int().min(1))
        .optional()
        .default('1'),
    limit: z
        .string()
        .transform(Number)
        .pipe(z.number().int().min(1).max(50))
        .optional()
        .default('20'),
    categoryId: z
        .string()
        .optional(),
    search: z
        .string()
        .max(100)
        .optional(),
    occasion: z
        .string()
        .max(100)
        .optional(),
});
//# sourceMappingURL=product.validation.js.map