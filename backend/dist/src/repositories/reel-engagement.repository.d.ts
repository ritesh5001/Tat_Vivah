export declare class ReelEngagementRepository {
    findLike(reelId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        reelId: string;
    } | null>;
    createLike(reelId: string, userId: string): Promise<[{
        id: string;
        createdAt: Date;
        userId: string;
        reelId: string;
    }, {
        status: import(".prisma/client", { with: { "resolution-mode": "require" } }).$Enums.ReelStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string | null;
        sellerId: string;
        category: import(".prisma/client", { with: { "resolution-mode": "require" } }).$Enums.ReelCategory;
        videoUrl: string;
        thumbnailUrl: string | null;
        caption: string | null;
        views: number;
        likes: number;
    }]>;
    deleteLike(reelId: string, userId: string): Promise<[{
        id: string;
        createdAt: Date;
        userId: string;
        reelId: string;
    }, {
        status: import(".prisma/client", { with: { "resolution-mode": "require" } }).$Enums.ReelStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string | null;
        sellerId: string;
        category: import(".prisma/client", { with: { "resolution-mode": "require" } }).$Enums.ReelCategory;
        videoUrl: string;
        thumbnailUrl: string | null;
        caption: string | null;
        views: number;
        likes: number;
    }]>;
    hasUserLiked(reelId: string, userId: string): Promise<boolean>;
    findRecentView(reelId: string, userId: string, since: Date): Promise<{
        id: string;
    } | null>;
    createView(reelId: string, userId: string | null): Promise<[{
        id: string;
        createdAt: Date;
        userId: string | null;
        reelId: string;
    }, {
        status: import(".prisma/client", { with: { "resolution-mode": "require" } }).$Enums.ReelStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string | null;
        sellerId: string;
        category: import(".prisma/client", { with: { "resolution-mode": "require" } }).$Enums.ReelCategory;
        videoUrl: string;
        thumbnailUrl: string | null;
        caption: string | null;
        views: number;
        likes: number;
    }]>;
    createProductClick(reelId: string, productId: string, userId: string | null): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        productId: string;
        reelId: string;
    }>;
    getReelAnalytics(reelId: string): Promise<{
        totalLikes: number;
        totalViews: number;
        totalProductClicks: number;
    }>;
    getSellerReelAnalytics(sellerId: string): Promise<{
        reelId: string;
        videoUrl: string;
        caption: string | null;
        status: import(".prisma/client", { with: { "resolution-mode": "require" } }).$Enums.ReelStatus;
        views: number;
        likes: number;
        productClicks: number;
        createdAt: Date;
        product: {
            id: string;
            title: string;
        } | null;
    }[]>;
}
export declare const reelEngagementRepository: ReelEngagementRepository;
//# sourceMappingURL=reel-engagement.repository.d.ts.map