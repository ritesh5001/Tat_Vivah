import { ApiError } from '../errors/ApiError.js';
import { reviewRepository } from '../repositories/review.repository.js';
export class ReviewService {
    async listReviews() {
        const reviews = await reviewRepository.findAll();
        return {
            reviews: reviews.map((review) => ({
                id: review.id,
                rating: review.rating,
                text: review.text,
                images: review.images,
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