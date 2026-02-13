import { apiRequest } from "./api";

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterUserPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    role: string;
    status: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  message: string;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/v1/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function registerUser(
  payload: RegisterUserPayload
): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>("/v1/auth/register", {
    method: "POST",
    body: payload,
  });
}
