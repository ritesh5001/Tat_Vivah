// Reel Domain Types

// ============================================================================
// ENTITY TYPES
// ============================================================================

export interface ReelEntity {
    id: string;
    sellerId: string;
    productId: string | null;
    videoUrl: string;
    thumbnailUrl: string | null;
    caption: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    views: number;
    likes: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ReelWithProduct extends ReelEntity {
    product: {
        id: string;
        title: string;
        images: string[];
        adminListingPrice: number | null;
        sellerPrice: number;
        status: string;
    } | null;
}

export interface ReelWithDetails extends ReelEntity {
    product: {
        id: string;
        title: string;
        images: string[];
        adminListingPrice: number | null;
        sellerPrice: number;
        status: string;
    } | null;
    seller: {
        id: string;
        email: string | null;
        seller_profiles: {
            store_name: string;
        } | null;
    };
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface CreateReelRequest {
    videoUrl: string;
    thumbnailUrl?: string | undefined;
    caption?: string | undefined;
    productId?: string | undefined;
}

export interface ReelQueryFilters {
    page?: number | undefined;
    limit?: number | undefined;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | undefined;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ReelListResponse {
    reels: ReelEntity[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface PublicReelListResponse {
    reels: ReelWithDetails[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ReelDetailResponse {
    reel: ReelWithDetails;
}

export interface AdminReelListResponse {
    reels: ReelWithDetails[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
