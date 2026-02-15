import { apiRequest } from "./api";

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
    sku: string;
    price: number;
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
  return apiRequest<CartResponse>("/v1/cart", { method: "GET", token });
}

export async function addCartItem(
  payload: AddCartItemPayload,
  token?: string | null
): Promise<CartItemMutationResponse> {
  return apiRequest<CartItemMutationResponse>("/v1/cart/items", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function updateCartItem(
  itemId: string,
  quantity: number,
  token?: string | null
): Promise<CartItemMutationResponse> {
  return apiRequest<CartItemMutationResponse>(`/v1/cart/items/${itemId}`, {
    method: "PUT",
    body: { quantity },
    token,
  });
}

export async function removeCartItem(
  itemId: string,
  token?: string | null
): Promise<CartItemDeleteResponse> {
  return apiRequest<CartItemDeleteResponse>(`/v1/cart/items/${itemId}`, {
    method: "DELETE",
    token,
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
    };
  }>(
    "/v1/checkout",
    {
      method: "POST",
      body: payload ?? {},
      token,
    }
  );
}
