import { prisma } from '../config/db.js';
/**
 * Category Repository
 * Handles database operations for categories
 */
export class CategoryRepository {
    /**
     * Find all categories (active + inactive)
     */
    async findAll() {
        return prisma.category.findMany({
            orderBy: { name: 'asc' },
        });
    }
    /**
     * Find all active categories
     */
    async findAllActive() {
        return prisma.category.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }
    /**
     * Find category by slug
     */
    async findBySlug(slug) {
        return prisma.category.findUnique({
            where: { slug },
        });
    }
    /**
     * Find category by ID
     */
    async findById(id) {
        return prisma.category.findUnique({
            where: { id },
        });
    }
    /**
     * Check if category exists and is active
     */
    async existsAndActive(id) {
        const category = await prisma.category.findFirst({
            where: { id, isActive: true },
            select: { id: true },
        });
        return category !== null;
    }
    /**
     * Create category
     */
    async create(data) {
        return prisma.category.create({
            data: {
                name: data.name,
                slug: data.slug,
                isActive: true,
            },
        });
    }
    /**
     * Update category
     */
    async update(id, data) {
        return prisma.category.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.slug !== undefined && { slug: data.slug }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });
    }
}
// Export singleton instance
export const categoryRepository = new CategoryRepository();
//# sourceMappingURL=category.repository.js.map