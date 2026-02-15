import { apiRequest } from "./api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WishlistItemDetail {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    description: string | null;
    images: string[];
    sellerPrice: number | null;
    adminListingPrice: number | null;
    isPublished: boolean;
    category: { id: string; name: string } | null;
  };
}

export interface WishlistResponse {
  wishlist: {
    id: string;
    userId: string;
    items: WishlistItemDetail[];
  };
}

export interface WishlistToggleResponse {
  message: string;
  added: boolean;
  productId: string;
}

export interface WishlistCountResponse {
  count: number;
}

export interface WishlistCheckResponse {
  wishlisted: string[];
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export async function getWishlist(
  token?: string | null
): Promise<WishlistResponse> {
  return apiRequest<WishlistResponse>("/v1/wishlist", {
    method: "GET",
    token,
  });
}

export async function getWishlistCount(
  token?: string | null
): Promise<WishlistCountResponse> {
  return apiRequest<WishlistCountResponse>("/v1/wishlist/count", {
    method: "GET",
    token,
  });
}

export async function toggleWishlistItem(
  productId: string,
  token?: string | null
): Promise<WishlistToggleResponse> {
  return apiRequest<WishlistToggleResponse>("/v1/wishlist/toggle", {
    method: "POST",
    body: { productId },
    token,
  });
}

export async function addWishlistItem(
  productId: string,
  token?: string | null
): Promise<WishlistToggleResponse> {
  return apiRequest<WishlistToggleResponse>("/v1/wishlist/items", {
    method: "POST",
    body: { productId },
    token,
  });
}

export async function removeWishlistItem(
  productId: string,
  token?: string | null
): Promise<WishlistToggleResponse> {
  return apiRequest<WishlistToggleResponse>(
    `/v1/wishlist/items/${productId}`,
    {
      method: "DELETE",
      token,
    }
  );
}

export async function checkWishlistItems(
  productIds: string[],
  token?: string | null
): Promise<WishlistCheckResponse> {
  return apiRequest<WishlistCheckResponse>("/v1/wishlist/check", {
    method: "POST",
    body: { productIds },
    token,
  });
}
