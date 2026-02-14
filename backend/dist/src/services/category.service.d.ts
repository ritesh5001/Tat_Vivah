import { CategoryRepository } from '../repositories/category.repository.js';
import type { CategoryListResponse } from '../types/product.types.js';
/**
 * Category Service
 * Business logic for category operations
 */
export declare class CategoryService {
    private readonly repository;
    constructor(repository: CategoryRepository);
    private slugify;
    private getUniqueSlug;
    /**
     * List all active categories
     * Uses Redis caching
     */
    listCategories(): Promise<CategoryListResponse>;
    /**
     * List all categories for admin (active + inactive)
     */
    listAllCategories(): Promise<CategoryListResponse>;
    /**
     * Create category (admin)
     */
    createCategory(name: string): Promise<import("../types/product.types.js").CategoryEntity>;
    /**
     * Update category (admin)
     */
    updateCategory(id: string, data: {
        name?: string;
        isActive?: boolean;
    }): Promise<import("../types/product.types.js").CategoryEntity>;
    /**
     * Deactivate category (admin)
     */
    deactivateCategory(id: string): Promise<import("../types/product.types.js").CategoryEntity>;
}
export declare const categoryService: CategoryService;
//# sourceMappingURL=category.service.d.ts.map