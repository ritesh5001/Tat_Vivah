import { apiRequest } from "@/services/api";

export interface SellerProduct {
  id: string;
  title: string;
  description?: string | null;
  sellerPrice?: number;
  adminListingPrice?: number | null;
  priceApprovedAt?: string | null;
  priceApprovedById?: string | null;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  approvedAt?: string | null;
  approvedById?: string | null;
  isPublished: boolean;
  deletedByAdmin?: boolean;
  deletedByAdminAt?: string | null;
  deletedByAdminReason?: string | null;
  category?: {
    id: string;
    name: string;
  };
  variants: Array<{
    id: string;
    color?: string | null;
    images?: string[];
    sku: string;
    price: number;
    compareAtPrice?: number | null;
    inventory?: {
      stock: number;
    } | null;
  }>;
}

export interface SellerProductListResponse {
  products: SellerProduct[];
}

export interface CreateProductPayload {
  categoryId: string;
  title: string;
  sellerPrice: number;
  description?: string;
  isPublished?: boolean;
  images?: string[];
  occasionIds?: string[];
}

export interface CreateVariantPayload {
  color?: string;
  images?: string[];
  sku: string;
  price: number;
  compareAtPrice?: number;
  initialStock?: number;
}

export interface UpdateVariantPayload {
  color?: string | null;
  images?: string[];
  price?: number;
  compareAtPrice?: number | null;
}

export async function listSellerProducts(token?: string | null) {
  return apiRequest<SellerProductListResponse>("/v1/seller/products", {
    method: "GET",
    token,
  });
}

export async function createSellerProduct(
  payload: CreateProductPayload,
  token?: string | null
) {
  return apiRequest<{ message: string; product: SellerProduct }>(
    "/v1/seller/products",
    {
      method: "POST",
      body: payload,
      token,
    }
  );
}

export async function deleteSellerProduct(
  productId: string,
  token?: string | null
) {
  return apiRequest<{ message: string }>(`/v1/seller/products/${productId}`,
    {
      method: "DELETE",
      token,
    }
  );
}

export async function updateSellerProduct(
  productId: string,
  payload: Partial<CreateProductPayload>,
  token?: string | null
) {
  return apiRequest<{ message: string; product: SellerProduct }>(
    `/v1/seller/products/${productId}`,
    {
      method: "PUT",
      body: payload,
      token,
    }
  );
}

export async function addVariantToProduct(
  productId: string,
  payload: CreateVariantPayload,
  token?: string | null
) {
  return apiRequest<{ message: string; variant: SellerProduct["variants"][0] }>(
    `/v1/seller/products/${productId}/variants`,
    {
      method: "POST",
      body: payload,
      token,
    }
  );
}

export async function updateVariantStock(
  variantId: string,
  stock: number,
  token?: string | null
) {
  return apiRequest<{ message: string; inventory: { variantId: string; stock: number } }>(
    `/v1/seller/products/variants/${variantId}/stock`,
    {
      method: "PUT",
      body: { stock },
      token,
    }
  );
}

export async function updateVariant(
  variantId: string,
  payload: UpdateVariantPayload,
  token?: string | null
) {
  return apiRequest<{ message: string; variant: SellerProduct["variants"][0] }>(
    `/v1/seller/products/variants/${variantId}`,
    {
      method: "PUT",
      body: payload,
      token,
    }
  );
}
