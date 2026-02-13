import { apiRequest } from "@/services/api";

export interface AdminProduct {
  id: string;
  title: string;
  description?: string | null;
  images?: string[];
  sellerId: string;
  sellerName?: string | null;
  sellerPhone?: string | null;
  sellerEmail?: string | null;
  categoryId: string;
  categoryName?: string | null;
  sellerPrice?: number;
  adminListingPrice?: number | null;
  priceApprovedAt?: string | null;
  priceApprovedById?: string | null;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  approvedAt?: string | null;
  approvedById?: string | null;
  variants?: Array<{
    id: string;
    sku: string;
    price: number;
    compareAtPrice?: number | null;
    stock?: number;
  }>;
  isPublished: boolean;
  deletedByAdmin: boolean;
  deletedByAdminAt?: string | null;
  deletedByAdminReason?: string | null;
  createdAt: string;
  moderation?: {
    status?: string | null;
    reason?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
  } | null;
}

export interface PricingOverviewProduct {
  productId: string;
  title: string;
  sellerId: string;
  sellerName?: string | null;
  sellerEmail?: string | null;
  sellerPrice: number;
  adminListingPrice?: number | null;
  margin?: number | null;
  marginPercentage?: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  image?: string | null;
  updatedAt: string;
}

export interface ProfitAnalytics {
  totalPlatformRevenue: number;
  totalSellerPayout: number;
  totalMarginEarned: number;
  profitPerProduct: Array<{
    productId: string;
    title: string;
    margin: number;
    soldUnits: number;
  }>;
  profitPerSeller: Array<{
    sellerId: string;
    sellerEmail?: string | null;
    sellerName?: string | null;
    margin: number;
    soldUnits: number;
  }>;
}

export interface AdminSeller {
  id: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  createdAt: string;
}

export interface AdminOrder {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items?: Array<{ id: string }>;
}

export interface AdminPayment {
  id: string;
  amount: number;
  status: string;
  provider: string;
  createdAt: string;
}

export interface AdminSettlement {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminReview {
  id: string;
  rating: number;
  text: string;
  images: string[];
  createdAt: string;
  product: {
    id: string;
    title: string;
  };
  user: {
    id: string;
    email?: string | null;
    fullName?: string | null;
    avatar?: string | null;
  };
}

export interface AdminBestseller {
  id: string;
  productId: string;
  position: number;
  title: string;
  categoryName?: string | null;
  sellerEmail?: string | null;
  isPublished: boolean;
  deletedByAdmin: boolean;
  image?: string | null;
}

export async function getSellers(token?: string | null) {
  return apiRequest<{ sellers: AdminSeller[] }>("/v1/admin/sellers", {
    method: "GET",
    token,
  });
}

export async function approveSeller(id: string, token?: string | null) {
  return apiRequest<{ message: string }>(`/v1/admin/sellers/${id}/approve`, {
    method: 'PUT',
    token,
  });
}

export async function suspendSeller(id: string, token?: string | null) {
  return apiRequest<{ message: string }>(`/v1/admin/sellers/${id}/suspend`, {
    method: 'PUT',
    token,
  });
}

export async function getPendingProducts(token?: string | null) {
  return apiRequest<{ products: AdminProduct[] }>(
    "/v1/admin/products/pending",
    {
      method: "GET",
      token,
    }
  );
}

export async function getAllProducts(token?: string | null) {
  return apiRequest<{ products: AdminProduct[] }>("/v1/admin/products", {
    method: "GET",
    token,
  });
}

export async function approveProduct(id: string, token?: string | null) {
  return apiRequest<{ message: string }>(`/v1/admin/products/${id}/approve`, {
    method: "PATCH",
    token,
  });
}

export async function rejectProduct(
  id: string,
  reason: string,
  token?: string | null
) {
  return apiRequest<{ message: string }>(`/v1/admin/products/${id}/reject`, {
    method: "PATCH",
    body: { reason },
    token,
  });
}

export async function setProductPrice(
  id: string,
  adminListingPrice: number,
  token?: string | null
) {
  return apiRequest<{
    sellerPrice: number;
    adminListingPrice: number;
    margin: number;
    marginPercentage: number;
  }>(`/v1/admin/products/${id}/set-price`, {
    method: "PATCH",
    body: { adminListingPrice },
    token,
  });
}

export async function getPricingOverview(token?: string | null) {
  return apiRequest<{ products: PricingOverviewProduct[] }>(
    "/v1/admin/products/pricing-overview",
    {
      method: "GET",
      token,
    }
  );
}

export async function getProfitAnalytics(token?: string | null) {
  return apiRequest<ProfitAnalytics>("/v1/admin/analytics/profit", {
    method: "GET",
    token,
  });
}

export async function deleteProduct(
  id: string,
  reason?: string,
  token?: string | null
) {
  return apiRequest<{ message: string }>(`/v1/admin/products/${id}`, {
    method: "DELETE",
    body: reason ? { reason } : undefined,
    token,
  });
}

export async function getOrders(token?: string | null) {
  return apiRequest<{ orders: AdminOrder[] }>("/v1/admin/orders", {
    method: "GET",
    token,
  });
}

export async function getPayments(token?: string | null) {
  return apiRequest<{ payments: AdminPayment[] }>("/v1/admin/payments", {
    method: "GET",
    token,
  });
}

export async function getSettlements(token?: string | null) {
  return apiRequest<{ settlements: AdminSettlement[] }>(
    "/v1/admin/settlements",
    {
      method: "GET",
      token,
    }
  );
}

export async function getAuditLogs(token?: string | null) {
  return apiRequest<{ auditLogs: AuditLog[] }>("/v1/admin/audit-logs", {
    method: "GET",
    token,
  });
}

export async function getAdminCategories(token?: string | null) {
  return apiRequest<{ categories: AdminCategory[] }>("/v1/admin/categories", {
    method: "GET",
    token,
  });
}

export async function createAdminCategory(name: string, token?: string | null) {
  return apiRequest<{ message: string; category: AdminCategory }>(
    "/v1/admin/categories",
    {
      method: "POST",
      body: { name },
      token,
    }
  );
}

export async function updateAdminCategory(
  id: string,
  data: { name?: string; isActive?: boolean },
  token?: string | null
) {
  return apiRequest<{ message: string; category: AdminCategory }>(
    `/v1/admin/categories/${id}`,
    {
      method: "PUT",
      body: data,
      token,
    }
  );
}

export async function deleteAdminCategory(id: string, token?: string | null) {
  return apiRequest<{ message: string; category: AdminCategory }>(
    `/v1/admin/categories/${id}`,
    {
      method: "DELETE",
      token,
    }
  );
}

export async function getAdminReviews(token?: string | null) {
  return apiRequest<{ reviews: AdminReview[] }>("/v1/admin/reviews", {
    method: "GET",
    token,
  });
}

export async function deleteAdminReview(id: string, token?: string | null) {
  return apiRequest<{ message: string }>(`/v1/admin/reviews/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function getAdminBestsellers(token?: string | null) {
  return apiRequest<{ bestsellers: AdminBestseller[] }>(
    "/v1/admin/bestsellers",
    {
      method: "GET",
      token,
    }
  );
}

export async function createAdminBestseller(
  productId: string,
  position?: number,
  token?: string | null
) {
  const body: { productId: string; position?: number } = { productId };
  if (typeof position === "number") {
    body.position = position;
  }

  return apiRequest<{ message: string; bestseller: AdminBestseller }>(
    "/v1/admin/bestsellers",
    {
      method: "POST",
      body,
      token,
    }
  );
}

export async function updateAdminBestseller(
  id: string,
  position: number,
  token?: string | null
) {
  return apiRequest<{ message: string; bestseller: AdminBestseller }>(
    `/v1/admin/bestsellers/${id}`,
    {
      method: "PUT",
      body: { position },
      token,
    }
  );
}

export async function deleteAdminBestseller(id: string, token?: string | null) {
  return apiRequest<{ message: string }>(`/v1/admin/bestsellers/${id}`, {
    method: "DELETE",
    token,
  });
}
