import { apiRequest } from "@/services/api";

interface User {
    id: string;
    fullName: string;
    avatar: string | null;
}

export interface Review {
    id: string;
    rating: number;
    title?: string | null;
    text: string;
    images: string[];
    helpfulCount?: number;
    createdAt: string;
    user: User;
}

export interface ReviewSummary {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
}

export interface ReviewListResponse {
    reviews: Review[];
    summary: ReviewSummary;
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface CreateReviewPayload {
    rating: number;
    title?: string;
    comment: string;
}

export async function fetchProductReviews(
    productId: string,
    query?: { page?: number; limit?: number; sort?: string }
): Promise<ReviewListResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.sort) params.set("sort", query.sort);
    const qs = params.toString();

    return apiRequest<ReviewListResponse>(
        `/v1/products/${productId}/reviews${qs ? `?${qs}` : ""}`,
        { method: "GET", showLoader: false }
    );
}

export async function submitProductReview(
    productId: string,
    payload: CreateReviewPayload,
    token?: string | null
): Promise<{ message: string; review: Review }> {
    return apiRequest<{ message: string; review: Review }>(
        `/v1/products/${productId}/reviews`,
        { method: "POST", body: payload, token }
    );
}

export async function markReviewHelpful(
    reviewId: string,
    token?: string | null
): Promise<{ message: string; helpfulCount: number }> {
    return apiRequest<{ message: string; helpfulCount: number }>(
        `/v1/reviews/${reviewId}/helpful`,
        { method: "POST", token }
    );
}
