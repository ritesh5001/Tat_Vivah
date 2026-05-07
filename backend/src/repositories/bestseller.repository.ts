import { prisma } from '../config/db.js';

export class BestsellerRepository {
    async listAdmin() {
        return prisma.bestseller.findMany({
            orderBy: { position: 'asc' },
            include: {
                product: {
                    include: {
                        category: { select: { name: true } },
                        seller: { select: { email: true } },
                    },
                },
            },
        });
    }

    async listPublic(limit: number) {
        return prisma.bestseller.findMany({
            where: {
                product: {
                    isPublished: true,
                    status: 'APPROVED',
                    deletedByAdmin: false,
                },
            },
            orderBy: { position: 'asc' },
            take: limit,
            include: {
                product: {
                    include: {
                        variants: {
                            where: { status: 'APPROVED' },
                        },
                        category: { select: { name: true } },
                    },
                },
            },
        });
    }

    async findByProductId(productId: string) {
        return prisma.bestseller.findUnique({
            where: { productId },
        });
    }

    async create(productId: string, position: number) {
        return prisma.bestseller.create({
            data: { productId, position },
        });
    }

    async update(id: string, position: number) {
        return prisma.bestseller.update({
            where: { id },
            data: { position },
        });
    }

    async delete(id: string) {
        return prisma.bestseller.delete({
            where: { id },
        });
    }

    async deleteByProductId(productId: string) {
        return prisma.bestseller.deleteMany({
            where: { productId },
        });
    }

    async getMaxPosition(): Promise<number> {
        const result = await prisma.bestseller.aggregate({
            _max: { position: true },
        });
        return result._max.position ?? 0;
    }

    async countAll(): Promise<number> {
        return prisma.bestseller.count();
    }
}

export const bestsellerRepository = new BestsellerRepository();
