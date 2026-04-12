import { ReelRepository } from '../repositories/reel.repository.js';
import type { CreateReelRequest, UpdateReelRequest, ReelQueryFilters, ReelListResponse, PublicReelListResponse, ReelDetailResponse, AdminReelListResponse } from '../types/reel.types.js';
export declare class ReelService {
    private readonly reelRepo;
    constructor(reelRepo: ReelRepository);
    createReel(sellerId: string, data: CreateReelRequest): Promise<{
        message: string;
        reel: {
            status: import(".prisma/client").$Enums.ReelStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string | null;
            sellerId: string;
            category: import(".prisma/client").$Enums.ReelCategory;
            videoUrl: string;
            thumbnailUrl: string | null;
            caption: string | null;
            views: number;
            likes: number;
        };
    }>;
    listSellerReels(sellerId: string, filters: ReelQueryFilters): Promise<ReelListResponse>;
    updateSellerReel(reelId: string, sellerId: string, data: UpdateReelRequest): Promise<{
        message: string;
        reel: {
            product: {
                status: import(".prisma/client").$Enums.ProductStatus;
                id: string;
                title: string;
                sellerPrice: import("@prisma/client/runtime/library").Decimal;
                adminListingPrice: import("@prisma/client/runtime/library").Decimal | null;
                images: string[];
            } | null;
        } & {
            status: import(".prisma/client").$Enums.ReelStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string | null;
            sellerId: string;
            category: import(".prisma/client").$Enums.ReelCategory;
            videoUrl: string;
            thumbnailUrl: string | null;
            caption: string | null;
            views: number;
            likes: number;
        };
    }>;
    deleteSellerReel(reelId: string, sellerId: string): Promise<{
        message: string;
    }>;
    listAdminReels(filters: ReelQueryFilters): Promise<AdminReelListResponse>;
    approveReel(reelId: string): Promise<{
        message: string;
        reel: {
            status: import(".prisma/client").$Enums.ReelStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string | null;
            sellerId: string;
            category: import(".prisma/client").$Enums.ReelCategory;
            videoUrl: string;
            thumbnailUrl: string | null;
            caption: string | null;
            views: number;
            likes: number;
        };
    }>;
    rejectReel(reelId: string): Promise<{
        message: string;
        reel: {
            status: import(".prisma/client").$Enums.ReelStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string | null;
            sellerId: string;
            category: import(".prisma/client").$Enums.ReelCategory;
            videoUrl: string;
            thumbnailUrl: string | null;
            caption: string | null;
            views: number;
            likes: number;
        };
    }>;
    deleteReelAdmin(reelId: string): Promise<{
        message: string;
    }>;
    listPublicReels(filters: ReelQueryFilters): Promise<PublicReelListResponse>;
    getPublicReel(reelId: string): Promise<ReelDetailResponse>;
}
export declare const reelService: ReelService;
//# sourceMappingURL=reel.service.d.ts.map