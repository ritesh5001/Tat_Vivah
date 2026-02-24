/**
 * Product Media Service
 * Business logic for product media attachments (images, videos)
 */
import type { CreateMediaInput, UpdateMediaInput } from '../validators/media.validation.js';
export declare class ProductMediaService {
    /**
     * Add media to a product (seller only, ownership verified)
     */
    addMedia(productId: string, sellerId: string, input: CreateMediaInput): Promise<{
        type: import(".prisma/client").$Enums.MediaType;
        id: string;
        createdAt: Date;
        productId: string;
        sortOrder: number;
        url: string;
        isThumbnail: boolean;
    }>;
    /**
     * Update media metadata (seller only, ownership verified)
     */
    updateMedia(mediaId: string, sellerId: string, input: UpdateMediaInput): Promise<{
        type: import(".prisma/client").$Enums.MediaType;
        id: string;
        createdAt: Date;
        productId: string;
        sortOrder: number;
        url: string;
        isThumbnail: boolean;
    }>;
    /**
     * Delete media (seller only, ownership verified)
     */
    deleteMedia(mediaId: string, sellerId: string): Promise<void>;
}
export declare const productMediaService: ProductMediaService;
//# sourceMappingURL=productMedia.service.d.ts.map