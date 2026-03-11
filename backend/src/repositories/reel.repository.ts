import { prisma } from '../config/db.js';
import type { ReelQueryFilters } from '../types/reel.types.js';

const productSelect = {
    id: true,
    title: true,
    images: true,
    adminListingPrice: true,
    sellerPrice: true,
    status: true,
} as const;

const sellerSelect = {
    id: true,
    email: true,
    seller_profiles: {
        select: { store_name: true },
    },
} as const;

export class ReelRepository {

    async create(data: {
        sellerId: string;
        videoUrl: string;
        thumbnailUrl?: string | undefined;
        caption?: string | undefined;
        productId?: string | undefined;
    }) {
        return prisma.reel.create({
            data: {
                sellerId: data.sellerId,
                videoUrl: data.videoUrl,
                thumbnailUrl: data.thumbnailUrl ?? null,
                caption: data.caption ?? null,
                productId: data.productId ?? null,
            },
        });
    }

    async findByIdAndSeller(id: string, sellerId: string) {
        return prisma.reel.findFirst({
            where: { id, sellerId },
            include: { product: { select: productSelect } },
        });
    }

    async findById(id: string) {
        return prisma.reel.findUnique({
            where: { id },
            include: {
                product: { select: productSelect },
                seller: { select: sellerSelect },
            },
        });
    }

    async findBySeller(sellerId: string, filters: ReelQueryFilters) {
        const { page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;

        const where = { sellerId };

        const [reels, total] = await Promise.all([
            prisma.reel.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { product: { select: productSelect } },
            }),
            prisma.reel.count({ where }),
        ]);

        return { reels, total };
    }

    async findAllAdmin(filters: ReelQueryFilters) {
        const { page = 1, limit = 20, status } = filters;
        const skip = (page - 1) * limit;

        const where = {
            ...(status && { status }),
        };

        const [reels, total] = await Promise.all([
            prisma.reel.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    product: { select: productSelect },
                    seller: { select: sellerSelect },
                },
            }),
            prisma.reel.count({ where }),
        ]);

        return { reels, total };
    }

    async findPublished(filters: ReelQueryFilters) {
        const { page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;

        const where = { status: 'APPROVED' as const };

        const [reels, total] = await Promise.all([
            prisma.reel.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    product: { select: productSelect },
                    seller: { select: sellerSelect },
                },
            }),
            prisma.reel.count({ where }),
        ]);

        return { reels, total };
    }

    async findPublishedById(id: string) {
        return prisma.reel.findFirst({
            where: { id, status: 'APPROVED' },
            include: {
                product: { select: productSelect },
                seller: { select: sellerSelect },
            },
        });
    }

    async updateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
        return prisma.reel.update({
            where: { id },
            data: { status },
        });
    }

    async incrementViews(id: string) {
        return prisma.reel.update({
            where: { id },
            data: { views: { increment: 1 } },
        });
    }

    async delete(id: string) {
        return prisma.reel.delete({ where: { id } });
    }

    async existsProduct(productId: string, sellerId: string) {
        const product = await prisma.product.findFirst({
            where: { id: productId, sellerId },
            select: { id: true },
        });
        return !!product;
    }
}

export const reelRepository = new ReelRepository();
