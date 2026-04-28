import { apiRequest } from "./apiClient";

export interface CartItemDetails {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  priceSnapshot: number;
  product?: {
    id: string;
    title: string;
    sellerId: string;
  };
  variant?: {
    id: string;
    size: string;
    sku: string;
    price: number;
    compareAtPrice?: number | null;
    inventory?: {
      stock: number;
    } | null;
  };
}

export interface CartResponse {
  cart: {
    id: string;
    userId: string;
    updatedAt: string;
    items: CartItemDetails[];
  };
}

export interface CartItemMutationResponse {
  message: string;
  item: {
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    priceSnapshot: number;
  };
}

export interface CartItemDeleteResponse {
  message: string;
}

export interface AddCartItemPayload {
  productId: string;
  variantId: string;
  quantity: number;
}

export async function getCart(token?: string | null): Promise<CartResponse> {
  return apiRequest<CartResponse>({
    url: "/v1/cart",
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function addCartItem(
  payload: AddCartItemPayload,
  token?: string | null
): Promise<CartItemMutationResponse> {
  return apiRequest<CartItemMutationResponse>({
    url: "/v1/cart/items",
    method: "POST",
    data: payload,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function updateCartItem(
  itemId: string,
  quantity: number,
  token?: string | null
): Promise<CartItemMutationResponse> {
  return apiRequest<CartItemMutationResponse>({
    url: `/v1/cart/items/${itemId}`,
    method: "PUT",
    data: { quantity },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function removeCartItem(
  itemId: string,
  token?: string | null
): Promise<CartItemDeleteResponse> {
  return apiRequest<CartItemDeleteResponse>({
    url: `/v1/cart/items/${itemId}`,
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export interface CouponPreview {
  code: string;
  type: "PERCENT" | "FLAT";
  value: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
}

export interface ValidateCouponResponse {
  valid: boolean;
  message?: string;
  coupon?: CouponPreview;
}

export async function validateCoupon(
  code: string,
  token?: string | null
): Promise<ValidateCouponResponse> {
  return apiRequest<ValidateCouponResponse>({
    url: "/v1/coupons/validate",
    method: "POST",
    data: { code },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export async function checkout(
  payload?: {
    shippingName?: string;
    shippingPhone?: string;
    shippingEmail?: string;
    shippingAddressLine1?: string;
    shippingAddressLine2?: string;
    shippingCity?: string;
    shippingNotes?: string;
    couponCode?: string;
  },
  token?: string | null
) {
  return apiRequest<{
    message: string;
    order: {
      id: string;
      totalAmount: number;
      subTotalAmount: number;
      totalTaxAmount: number;
      grandTotal: number;
      couponCode?: string | null;
      discountAmount?: number;
    };
  }>({
    url: "/v1/checkout",
    method: "POST",
    data: payload ?? {},
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
