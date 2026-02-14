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

/** Backend wraps reviews in a `{ reviews: [...] }` envelope. */
interface ReviewsResponse {
  reviews: Review[];
}

export async function fetchProductReviews(productId: string): Promise<Review[]> {
  const response = await apiRequest<ReviewsResponse>(
    `/v1/reviews/product/${productId}`,
    { method: "GET" }
  );
  return response.reviews ?? [];
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
