import { prisma } from '../config/db.js';

export interface OccasionEntity {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Occasion Repository
 * Handles database operations for occasions
 */
export class OccasionRepository {
    async findAll(): Promise<OccasionEntity[]> {
        return prisma.occasion.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async findAllActive(): Promise<OccasionEntity[]> {
        return prisma.occasion.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    async findById(id: string): Promise<OccasionEntity | null> {
        return prisma.occasion.findUnique({ where: { id } });
    }

    async findBySlug(slug: string): Promise<OccasionEntity | null> {
        return prisma.occasion.findUnique({ where: { slug } });
    }

    async create(data: {
        name: string;
        slug: string;
        image?: string | undefined;
    }): Promise<OccasionEntity> {
        return prisma.occasion.create({
            data: {
                name: data.name,
                slug: data.slug,
                isActive: true,
                ...(data.image !== undefined && { image: data.image }),
            },
        });
    }

    async update(
        id: string,
        data: {
            name?: string | undefined;
            slug?: string | undefined;
            image?: string | null | undefined;
            isActive?: boolean | undefined;
        }
    ): Promise<OccasionEntity> {
        return prisma.occasion.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.slug !== undefined && { slug: data.slug }),
                ...(data.image !== undefined && { image: data.image }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });
    }

    async delete(id: string): Promise<void> {
        await prisma.occasion.delete({ where: { id } });
    }

    async hasProducts(id: string): Promise<boolean> {
        const count = await prisma.productOccasion.count({
            where: { occasionId: id },
        });
        return count > 0;
    }

    /**
     * Find product IDs linked to a given occasion slug.
     */
    async findProductIdsBySlug(slug: string): Promise<string[]> {
        const occasion = await prisma.occasion.findUnique({
            where: { slug },
            select: { id: true, isActive: true },
        });
        if (!occasion || !occasion.isActive) return [];

        const links = await prisma.productOccasion.findMany({
            where: { occasionId: occasion.id },
            select: { productId: true },
        });
        return links.map((link) => link.productId);
    }

    /**
     * Sync occasions for a product (replace all).
     */
    async syncProductOccasions(productId: string, occasionIds: string[]): Promise<void> {
        await prisma.$transaction([
            prisma.productOccasion.deleteMany({ where: { productId } }),
            ...(occasionIds.length > 0
                ? [
                    prisma.productOccasion.createMany({
                        data: occasionIds.map((occasionId) => ({
                            productId,
                            occasionId,
                        })),
                        skipDuplicates: true,
                    }),
                ]
                : []),
        ]);
    }

    /**
     * Get occasion IDs for a product.
     */
    async getProductOccasionIds(productId: string): Promise<string[]> {
        const links = await prisma.productOccasion.findMany({
            where: { productId },
            select: { occasionId: true },
        });
        return links.map((link) => link.occasionId);
    }
}

export const occasionRepository = new OccasionRepository();
