import { apiRequest } from "@/services/api";

export interface Occasion {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  isActive: boolean;
}

export async function getOccasions() {
  return apiRequest<{ occasions: Occasion[] }>("/v1/occasions", {
    method: "GET",
  });
}
