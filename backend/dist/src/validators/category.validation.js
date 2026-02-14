import { z } from 'zod';
export const createCategorySchema = z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters'),
});
export const updateCategorySchema = z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters').optional(),
    isActive: z.boolean().optional(),
});
//# sourceMappingURL=category.validation.js.map