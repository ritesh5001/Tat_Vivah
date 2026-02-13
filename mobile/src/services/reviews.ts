import { apiRequest } from "./api";

export interface Review {
  id: string;
  rating: number;
  text: string;
  images: string[];
  createdAt: string;
  user: {
    fullName?: string | null;
    avatar?: string | null;
  };
}

export async function fetchProductReviews(productId: string): Promise<Review[]> {
  return apiRequest<Review[]>(`/v1/reviews/product/${productId}`, {
    method: "GET",
  });
}

export async function submitProductReview(
  productId: string,
  payload: { rating: number; text: string; images: string[] },
  token?: string | null
) {
  return apiRequest<{ message: string }>(`/v1/reviews/product/${productId}`, {
    method: "POST",
    body: payload,
    token,
  });
}
