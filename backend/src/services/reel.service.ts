import { ReelRepository, reelRepository } from '../repositories/reel.repository.js';
import { ApiError } from '../errors/ApiError.js';
import { compressReelVideo } from '../jobs/reel-compression.job.js';
import type {
    CreateReelRequest,
    ReelQueryFilters,
    ReelListResponse,
    PublicReelListResponse,
    ReelDetailResponse,
    AdminReelListResponse,
} from '../types/reel.types.js';

export class ReelService {
    constructor(private readonly reelRepo: ReelRepository) {}

    // =========================================================================
    // SELLER ENDPOINTS
    // =========================================================================

    async createReel(sellerId: string, data: CreateReelRequest) {
        // Validate product ownership if productId is provided
        if (data.productId) {
            const ownsProduct = await this.reelRepo.existsProduct(data.productId, sellerId);
            if (!ownsProduct) {
                throw ApiError.forbidden('Product does not belong to you');
            }
        }

        const reel = await this.reelRepo.create({
            sellerId,
            videoUrl: data.videoUrl,
            thumbnailUrl: data.thumbnailUrl,
            caption: data.caption,
            productId: data.productId,
        });

        // Fire-and-forget: compress video + extract metadata
        compressReelVideo(reel.id, reel.videoUrl).catch(() => {});

        return { message: 'Reel submitted for approval', reel };
    }

    async listSellerReels(sellerId: string, filters: ReelQueryFilters): Promise<ReelListResponse> {
        const { reels, total } = await this.reelRepo.findBySeller(sellerId, filters);
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;

        return {
            reels: reels.map((r) => ({
                ...r,
                sellerPrice: r.product ? Number(r.product.sellerPrice) : undefined,
                adminListingPrice: r.product?.adminListingPrice ? Number(r.product.adminListingPrice) : undefined,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async deleteSellerReel(reelId: string, sellerId: string) {
        const reel = await this.reelRepo.findByIdAndSeller(reelId, sellerId);
        if (!reel) {
            throw ApiError.notFound('Reel not found or you do not have permission');
        }

        await this.reelRepo.delete(reelId);
        return { message: 'Reel deleted successfully' };
    }

    // =========================================================================
    // ADMIN ENDPOINTS
    // =========================================================================

    async listAdminReels(filters: ReelQueryFilters): Promise<AdminReelListResponse> {
        const { reels, total } = await this.reelRepo.findAllAdmin(filters);
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;

        return {
            reels: reels.map((r) => ({
                ...r,
                product: r.product
                    ? {
                          ...r.product,
                          sellerPrice: Number(r.product.sellerPrice),
                          adminListingPrice: r.product.adminListingPrice
                              ? Number(r.product.adminListingPrice)
                              : null,
                      }
                    : null,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async approveReel(reelId: string) {
        const reel = await this.reelRepo.findById(reelId);
        if (!reel) {
            throw ApiError.notFound('Reel not found');
        }

        const updated = await this.reelRepo.updateStatus(reelId, 'APPROVED');
        return { message: 'Reel approved successfully', reel: updated };
    }

    async rejectReel(reelId: string) {
        const reel = await this.reelRepo.findById(reelId);
        if (!reel) {
            throw ApiError.notFound('Reel not found');
        }

        const updated = await this.reelRepo.updateStatus(reelId, 'REJECTED');
        return { message: 'Reel rejected successfully', reel: updated };
    }

    async deleteReelAdmin(reelId: string) {
        const reel = await this.reelRepo.findById(reelId);
        if (!reel) {
            throw ApiError.notFound('Reel not found');
        }

        await this.reelRepo.delete(reelId);
        return { message: 'Reel deleted by admin' };
    }

    // =========================================================================
    // PUBLIC ENDPOINTS
    // =========================================================================

    async listPublicReels(filters: ReelQueryFilters): Promise<PublicReelListResponse> {
        const { reels, total } = await this.reelRepo.findPublished(filters);
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;

        return {
            reels: reels.map((r) => ({
                ...r,
                product: r.product
                    ? {
                          ...r.product,
                          sellerPrice: Number(r.product.sellerPrice),
                          adminListingPrice: r.product.adminListingPrice
                              ? Number(r.product.adminListingPrice)
                              : null,
                      }
                    : null,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getPublicReel(reelId: string): Promise<ReelDetailResponse> {
        const reel = await this.reelRepo.findPublishedById(reelId);
        if (!reel) {
            throw ApiError.notFound('Reel not found');
        }

        // Increment views in background (fire-and-forget)
        this.reelRepo.incrementViews(reelId).catch(() => {});

        return {
            reel: {
                ...reel,
                product: reel.product
                    ? {
                          ...reel.product,
                          sellerPrice: Number(reel.product.sellerPrice),
                          adminListingPrice: reel.product.adminListingPrice
                              ? Number(reel.product.adminListingPrice)
                              : null,
                      }
                    : null,
            },
        };
    }
}

export const reelService = new ReelService(reelRepository);
