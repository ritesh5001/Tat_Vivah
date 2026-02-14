import type { CategoryEntity } from '../types/product.types.js';
/**
 * Category Repository
 * Handles database operations for categories
 */
export declare class CategoryRepository {
    /**
     * Find all categories (active + inactive)
     */
    findAll(): Promise<CategoryEntity[]>;
    /**
     * Find all active categories
     */
    findAllActive(): Promise<CategoryEntity[]>;
    /**
     * Find category by slug
     */
    findBySlug(slug: string): Promise<CategoryEntity | null>;
    /**
     * Find category by ID
     */
    findById(id: string): Promise<CategoryEntity | null>;
    /**
     * Check if category exists and is active
     */
    existsAndActive(id: string): Promise<boolean>;
    /**
     * Create category
     */
    create(data: {
        name: string;
        slug: string;
    }): Promise<CategoryEntity>;
    /**
     * Update category
     */
    update(id: string, data: {
        name?: string;
        slug?: string;
        isActive?: boolean;
    }): Promise<CategoryEntity>;
}
export declare const categoryRepository: CategoryRepository;
//# sourceMappingURL=category.repository.d.ts.map