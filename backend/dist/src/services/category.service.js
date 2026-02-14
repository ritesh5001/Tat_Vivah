import { categoryRepository } from '../repositories/category.repository.js';
import { getFromCache, setCache, CACHE_KEYS, invalidateCache, } from '../utils/cache.util.js';
import { ApiError } from '../errors/ApiError.js';
/**
 * Category Service
 * Business logic for category operations
 */
export class CategoryService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    slugify(value) {
        return value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    async getUniqueSlug(base, excludeId) {
        let slug = base;
        let counter = 1;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const existing = await this.repository.findBySlug(slug);
            if (!existing || (excludeId && existing.id === excludeId)) {
                return slug;
            }
            counter += 1;
            slug = `${base}-${counter}`;
        }
    }
    /**
     * List all active categories
     * Uses Redis caching
     */
    async listCategories() {
        // Try cache first
        const cached = await getFromCache(CACHE_KEYS.CATEGORIES_LIST);
        if (cached) {
            return cached;
        }
        // Fetch from database
        const categories = await this.repository.findAllActive();
        const response = { categories };
        // Cache the result
        await setCache(CACHE_KEYS.CATEGORIES_LIST, response);
        return response;
    }
    /**
     * List all categories for admin (active + inactive)
     */
    async listAllCategories() {
        const categories = await this.repository.findAll();
        return { categories };
    }
    /**
     * Create category (admin)
     */
    async createCategory(name) {
        const baseSlug = this.slugify(name);
        if (!baseSlug) {
            throw ApiError.badRequest('Invalid category name');
        }
        const slug = await this.getUniqueSlug(baseSlug);
        const created = await this.repository.create({ name, slug });
        await invalidateCache(CACHE_KEYS.CATEGORIES_LIST);
        return created;
    }
    /**
     * Update category (admin)
     */
    async updateCategory(id, data) {
        const category = await this.repository.findById(id);
        if (!category) {
            throw ApiError.notFound('Category not found');
        }
        let slug;
        if (data.name) {
            const baseSlug = this.slugify(data.name);
            if (!baseSlug) {
                throw ApiError.badRequest('Invalid category name');
            }
            slug = await this.getUniqueSlug(baseSlug, id);
        }
        const updated = await this.repository.update(id, {
            ...(data.name ? { name: data.name } : {}),
            ...(slug ? { slug } : {}),
            ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        });
        await invalidateCache(CACHE_KEYS.CATEGORIES_LIST);
        return updated;
    }
    /**
     * Deactivate category (admin)
     */
    async deactivateCategory(id) {
        const category = await this.repository.findById(id);
        if (!category) {
            throw ApiError.notFound('Category not found');
        }
        const updated = await this.repository.update(id, { isActive: false });
        await invalidateCache(CACHE_KEYS.CATEGORIES_LIST);
        return updated;
    }
}
// Export singleton instance with default repository
export const categoryService = new CategoryService(categoryRepository);
//# sourceMappingURL=category.service.js.map