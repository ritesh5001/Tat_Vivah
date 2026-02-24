interface CreateReviewInput {
    rating: number;
    title?: string;
    comment: string;
}
interface ReviewQuery {
    page: number;
    limit: number;
    sort: string;
}
export declare class ReviewService {
    /**
     * Create a review (one per user per product)
     */
    createReview(productId: string, userId: string, input: CreateReviewInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        productId: string;
        title: string | null;
        images: string[];
        rating: number;
        text: string;
        helpfulCount: number;
        isHidden: boolean;
    }>;
    /**
     * Get reviews for a product with pagination, sorting, and rating summary
     */
    getProductReviews(productId: string, query: ReviewQuery): Promise<{
        reviews: {
            id: any;
            rating: any;
            title: any;
            text: any;
            images: any;
            helpfulCount: any;
            createdAt: any;
            user: {
                id: any;
                email: any;
                fullName: any;
                avatar: any;
            };
        }[];
        summary: {
            averageRating: number;
            totalReviews: number;
            ratingDistribution: Record<number, number>;
        };
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Mark a review as helpful (increment counter)
     */
    markHelpful(reviewId: string): Promise<{
        id: string;
        helpfulCount: number;
    }>;
    /**
     * Set hidden state on a review (admin)
     */
    setHidden(reviewId: string, isHidden: boolean): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        productId: string;
        title: string | null;
        images: string[];
        rating: number;
        text: string;
        helpfulCount: number;
        isHidden: boolean;
    }>;
    /**
     * List all reviews for admin (includes hidden)
     */
    listReviews(): Promise<{
        reviews: {
            id: any;
            rating: any;
            title: any;
            text: any;
            images: any;
            helpfulCount: any;
            isHidden: any;
            createdAt: any;
            product: {
                id: any;
                title: any;
            };
            user: {
                id: any;
                email: any;
                fullName: any;
                avatar: any;
            };
        }[];
    }>;
    deleteReview(id: string): Promise<void>;
}
export declare const reviewService: ReviewService;
export {};
//# sourceMappingURL=review.service.d.ts.map