import { prisma } from '../config/db.js';
import { ApiError } from '../errors/ApiError.js';
import { reviewRepository } from '../repositories/review.repository.js';
export class ReviewService {
    /**
     * Create a review (one per user per product)
     */
    async createReview(productId, userId, input) {
        // Verify product exists
        const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
        if (!product)
            throw ApiError.notFound('Product not found');
        // Check duplicate
        const existing = await prisma.review.findFirst({
            where: { productId, userId },
        });
        if (existing)
            throw ApiError.conflict('You have already reviewed this product');
        return prisma.review.create({
            data: {
                productId,
                userId,
                rating: input.rating,
                title: input.title ?? null,
                text: input.comment,
            },
        });
    }
    /**
     * Get reviews for a product with pagination, sorting, and rating summary
     */
    async getProductReviews(productId, query) {
        const skip = (query.page - 1) * query.limit;
        const orderBy = (() => {
            switch (query.sort) {
                case 'oldest': return { createdAt: 'asc' };
                case 'highest': return { rating: 'desc' };
                case 'lowest': return { rating: 'asc' };
                case 'helpful': return { helpfulCount: 'desc' };
                case 'newest':
                default: return { createdAt: 'desc' };
            }
        })();
        const where = { productId, isHidden: false };
        const [reviews, total, ratingAgg] = await Promise.all([
            prisma.review.findMany({
                where,
                orderBy,
                skip,
                take: query.limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            user_profiles: { select: { full_name: true, avatar: true } },
                        },
                    },
                },
            }),
            prisma.review.count({ where }),
            prisma.review.groupBy({
                by: ['rating'],
                where: { productId },
                _count: { rating: true },
            }),
        ]);
        // Build rating distribution
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRatings = 0;
        let ratingSum = 0;
        for (const r of ratingAgg) {
            ratingDistribution[r.rating] = r._count.rating;
            totalRatings += r._count.rating;
            ratingSum += r.rating * r._count.rating;
        }
        return {
            reviews: reviews.map((r) => ({
                id: r.id,
                rating: r.rating,
                title: r.title,
                text: r.text,
                images: r.images,
                helpfulCount: r.helpfulCount,
                createdAt: r.createdAt,
                user: {
                    id: r.user.id,
                    email: r.user.email,
                    fullName: r.user.user_profiles?.full_name ?? 'Anonymous',
                    avatar: r.user.user_profiles?.avatar ?? null,
                },
            })),
            summary: {
                averageRating: totalRatings > 0 ? +(ratingSum / totalRatings).toFixed(1) : 0,
                totalReviews: totalRatings,
                ratingDistribution,
            },
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }
    /**
     * Mark a review as helpful (increment counter)
     */
    async markHelpful(reviewId) {
        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review)
            throw ApiError.notFound('Review not found');
        return prisma.review.update({
            where: { id: reviewId },
            data: { helpfulCount: { increment: 1 } },
            select: { id: true, helpfulCount: true },
        });
    }
    /**
     * Set hidden state on a review (admin)
     */
    async setHidden(reviewId, isHidden) {
        const review = await prisma.review.findUnique({ where: { id: reviewId } });
        if (!review)
            throw ApiError.notFound('Review not found');
        return prisma.review.update({
            where: { id: reviewId },
            data: { isHidden },
        });
    }
    /**
     * List all reviews for admin (includes hidden)
     */
    async listReviews() {
        const reviews = await reviewRepository.findAll();
        return {
            reviews: reviews.map((review) => ({
                id: review.id,
                rating: review.rating,
                title: review.title,
                text: review.text,
                images: review.images,
                helpfulCount: review.helpfulCount,
                isHidden: review.isHidden,
                createdAt: review.createdAt,
                product: {
                    id: review.product.id,
                    title: review.product.title,
                },
                user: {
                    id: review.user.id,
                    email: review.user.email,
                    fullName: review.user.user_profiles?.full_name ?? 'Anonymous',
                    avatar: review.user.user_profiles?.avatar ?? null,
                },
            })),
        };
    }
    async deleteReview(id) {
        try {
            await reviewRepository.deleteById(id);
        }
        catch (error) {
            if (error?.code === 'P2025') {
                throw ApiError.notFound('Review not found');
            }
            throw error;
        }
    }
}
export const reviewService = new ReviewService();
//# sourceMappingURL=review.service.js.map