import type { ReelQueryFilters } from '../types/reel.types.js';
export declare class ReelRepository {
    create(data: {
        sellerId: string;
        videoUrl: string;
        thumbnailUrl?: string | undefined;
        caption?: string | undefined;
        productId?: string | undefined;
    }): Promise<{
        status: import(".prisma/client").$Enums.ReelStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string | null;
        sellerId: string;
        videoUrl: string;
        thumbnailUrl: string | null;
        caption: string | null;
        views: number;
        likes: number;
    }>;
    findByIdAndSeller(id: string, sellerId: string): Promise<({
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
        videoUrl: string;
        thumbnailUrl: string | null;
        caption: string | null;
        views: number;
        likes: number;
    }) | null>;
    findById(id: string): Promise<({
        product: {
            status: import(".prisma/client").$Enums.ProductStatus;
            id: string;
            title: string;
            sellerPrice: import("@prisma/client/runtime/library").Decimal;
            adminListingPrice: import("@prisma/client/runtime/library").Decimal | null;
            images: string[];
        } | null;
        seller: {
            id: string;
            email: string | null;
            seller_profiles: {
                store_name: string;
            } | null;
        };
    } & {
        status: import(".prisma/client").$Enums.ReelStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string | null;
        sellerId: string;
        videoUrl: string;
        thumbnailUrl: string | null;
        caption: string | null;
        views: number;
        likes: number;
    }) | null>;
    findBySeller(sellerId: string, filters: ReelQueryFilters): Promise<{
        reels: ({
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
            videoUrl: string;
            thumbnailUrl: string | null;
            caption: string | null;
            views: number;
            likes: number;
        })[];
        total: number;
    }>;
    findAllAdmin(filters: ReelQueryFilters): Promise<{
        reels: ({
            product: {
                status: import(".prisma/client").$Enums.ProductStatus;
                id: string;
                title: string;
                sellerPrice: import("@prisma/client/runtime/library").Decimal;
                adminListingPrice: import("@prisma/client/runtime/library").Decimal | null;
                images: string[];
            } | null;
            seller: {
                id: string;
                email: string | null;
                seller_profiles: {
                    store_name: string;
                } | null;
            };
        } & {
            status: import(".prisma/client").$Enums.ReelStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string | null;
            sellerId: string;
            videoUrl: string;
            thumbnailUrl: string | null;
            caption: string | null;
            views: number;
            likes: number;
        })[];
        total: number;
    }>;
    findPublished(filters: ReelQueryFilters): Promise<{
        reels: ({
            product: {
                status: import(".prisma/client").$Enums.ProductStatus;
                id: string;
                title: string;
                sellerPrice: import("@prisma/client/runtime/library").Decimal;
                adminListingPrice: import("@prisma/client/runtime/library").Decimal | null;
                images: string[];
            } | null;
            seller: {
                id: string;
                email: string | null;
                seller_profiles: {
                    store_name: string;
                } | null;
            };
        } & {
            status: import(".prisma/client").$Enums.ReelStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string | null;
            sellerId: string;
            videoUrl: string;
            thumbnailUrl: string | null;
            caption: string | null;
            views: number;
            likes: number;
        })[];
        total: number;
    }>;
    findPublishedById(id: string): Promise<({
        product: {
            status: import(".prisma/client").$Enums.ProductStatus;
            id: string;
            title: string;
            sellerPrice: import("@prisma/client/runtime/library").Decimal;
            adminListingPrice: import("@prisma/client/runtime/library").Decimal | null;
            images: string[];
        } | null;
        seller: {
            id: string;
            email: string | null;
            seller_profiles: {
                store_name: string;
            } | null;
        };
    } & {
        status: import(".prisma/client").$Enums.ReelStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string | null;
        sellerId: string;
        videoUrl: string;
        thumbnailUrl: string | null;
        caption: string | null;
        views: number;
        likes: number;
    }) | null>;
    updateStatus(id: string, status: 'APPROVED' | 'REJECTED'): Promise<{
        status: import(".prisma/client").$Enums.ReelStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string | null;
        sellerId: string;
        videoUrl: string;
        thumbnailUrl: string | null;
        caption: string | null;
        views: number;
        likes: number;
    }>;
    incrementViews(id: string): Promise<{
        status: import(".prisma/client").$Enums.ReelStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string | null;
        sellerId: string;
        videoUrl: string;
        thumbnailUrl: string | null;
        caption: string | null;
        views: number;
        likes: number;
    }>;
    delete(id: string): Promise<{
        status: import(".prisma/client").$Enums.ReelStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string | null;
        sellerId: string;
        videoUrl: string;
        thumbnailUrl: string | null;
        caption: string | null;
        views: number;
        likes: number;
    }>;
    existsProduct(productId: string, sellerId: string): Promise<boolean>;
}
export declare const reelRepository: ReelRepository;
//# sourceMappingURL=reel.repository.d.ts.map