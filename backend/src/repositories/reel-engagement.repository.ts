import { prisma } from '../config/db.js';

export class ReelEngagementRepository {

    // =========================================================================
    // LIKES
    // =========================================================================

    async findLike(reelId: string, userId: string) {
        return prisma.reelLike.findUnique({
            where: { reelId_userId: { reelId, userId } },
        });
    }

    async createLike(reelId: string, userId: string) {
        return prisma.$transaction([
            prisma.reelLike.create({ data: { reelId, userId } }),
            prisma.reel.update({ where: { id: reelId }, data: { likes: { increment: 1 } } }),
        ]);
    }

    async deleteLike(reelId: string, userId: string) {
        return prisma.$transaction([
            prisma.reelLike.delete({ where: { reelId_userId: { reelId, userId } } }),
            prisma.reel.update({ where: { id: reelId }, data: { likes: { decrement: 1 } } }),
        ]);
    }

    async hasUserLiked(reelId: string, userId: string): Promise<boolean> {
        const like = await prisma.reelLike.findUnique({
            where: { reelId_userId: { reelId, userId } },
            select: { id: true },
        });
        return !!like;
    }

    // =========================================================================
    // VIEWS
    // =========================================================================

    async findRecentView(reelId: string, userId: string, since: Date) {
        return prisma.reelView.findFirst({
            where: {
                reelId,
                userId,
                createdAt: { gte: since },
            },
            select: { id: true },
        });
    }

    async createView(reelId: string, userId: string | null) {
        return prisma.$transaction([
            prisma.reelView.create({ data: { reelId, userId } }),
            prisma.reel.update({ where: { id: reelId }, data: { views: { increment: 1 } } }),
        ]);
    }

    // =========================================================================
    // PRODUCT CLICKS
    // =========================================================================

    async createProductClick(reelId: string, productId: string, userId: string | null) {
        return prisma.reelProductClick.create({
            data: { reelId, productId, userId },
        });
    }

    // =========================================================================
    // ANALYTICS
    // =========================================================================

    async getReelAnalytics(reelId: string) {
        const [totalLikes, totalViews, totalProductClicks] = await Promise.all([
            prisma.reelLike.count({ where: { reelId } }),
            prisma.reelView.count({ where: { reelId } }),
            prisma.reelProductClick.count({ where: { reelId } }),
        ]);
        return { totalLikes, totalViews, totalProductClicks };
    }

    async getSellerReelAnalytics(sellerId: string) {
        const reels = await prisma.reel.findMany({
            where: { sellerId },
            select: {
                id: true,
                videoUrl: true,
                caption: true,
                status: true,
                views: true,
                likes: true,
                createdAt: true,
                product: { select: { id: true, title: true } },
                _count: { select: { reelProductClicks: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return reels.map((r) => ({
            reelId: r.id,
            videoUrl: r.videoUrl,
            caption: r.caption,
            status: r.status,
            views: r.views,
            likes: r.likes,
            productClicks: r._count.reelProductClicks,
            createdAt: r.createdAt,
            product: r.product,
        }));
    }
}

export const reelEngagementRepository = new ReelEngagementRepository();
