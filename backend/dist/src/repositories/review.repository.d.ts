export declare class ReviewRepository {
    findAll(): Promise<({
        user: {
            id: string;
            email: string | null;
            user_profiles: {
                full_name: string;
                avatar: string | null;
            } | null;
        };
        product: {
            id: string;
            title: string;
        };
    } & {
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
    })[]>;
    deleteById(id: string): Promise<{
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
}
export declare const reviewRepository: ReviewRepository;
//# sourceMappingURL=review.repository.d.ts.map