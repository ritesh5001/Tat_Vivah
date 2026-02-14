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
    async listPublic(limit) {
        return prisma.bestseller.findMany({
            where: {
                product: {
                    isPublished: true,
                    deletedByAdmin: false,
                },
            },
            orderBy: { position: 'asc' },
            take: limit,
            include: {
                product: {
                    include: {
                        variants: true,
                        category: { select: { name: true } },
                    },
                },
            },
        });
    }
    async findByProductId(productId) {
        return prisma.bestseller.findUnique({
            where: { productId },
        });
    }
    async create(productId, position) {
        return prisma.bestseller.create({
            data: { productId, position },
        });
    }
    async update(id, position) {
        return prisma.bestseller.update({
            where: { id },
            data: { position },
        });
    }
    async delete(id) {
        return prisma.bestseller.delete({
            where: { id },
        });
    }
    async deleteByProductId(productId) {
        return prisma.bestseller.deleteMany({
            where: { productId },
        });
    }
    async getMaxPosition() {
        const result = await prisma.bestseller.aggregate({
            _max: { position: true },
        });
        return result._max.position ?? 0;
    }
    async countAll() {
        return prisma.bestseller.count();
    }
}
export const bestsellerRepository = new BestsellerRepository();
//# sourceMappingURL=bestseller.repository.js.map