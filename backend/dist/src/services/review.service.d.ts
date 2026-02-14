export declare class ReviewService {
    listReviews(): Promise<{
        reviews: {
            id: any;
            rating: any;
            text: any;
            images: any;
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
//# sourceMappingURL=review.service.d.ts.map