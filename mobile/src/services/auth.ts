import { apiRequest } from "./api";

// ---------------------------------------------------------------------------
// Types — mirrors backend auth contracts exactly
// ---------------------------------------------------------------------------

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

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  message: string;
}

export interface MessageResponse {
  message: string;
}

/** POST /v1/auth/request-otp body */
export interface RequestOtpPayload {
  email: string;
}

/** POST /v1/auth/verify-otp body */
export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

/**
 * verify-otp returns EITHER a full LoginResponse (with tokens)
 * or just a MessageResponse (e.g. "Seller approval pending").
 * We discriminate by the presence of `accessToken`.
 */
export type VerifyOtpResponse = LoginResponse | MessageResponse;

export function isLoginResponse(res: VerifyOtpResponse): res is LoginResponse {
  return "accessToken" in res && typeof (res as LoginResponse).accessToken === "string";
}

// ---------------------------------------------------------------------------
// BUYER-ONLY role enforcement constant
// ---------------------------------------------------------------------------
export const ALLOWED_ROLE = "USER" as const;

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** POST /v1/auth/login */
export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/v1/auth/login", {
    method: "POST",
    body: payload,
  });
}

/** POST /v1/auth/register */
export async function registerUser(
  payload: RegisterUserPayload
): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>("/v1/auth/register", {
    method: "POST",
    body: payload,
  });
}

/** POST /v1/auth/request-otp */
export async function requestOtp(
  payload: RequestOtpPayload
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/v1/auth/request-otp", {
    method: "POST",
    body: payload,
  });
}

/** POST /v1/auth/verify-otp — may return tokens or a message-only response */
export async function verifyOtp(
  payload: VerifyOtpPayload
): Promise<VerifyOtpResponse> {
  return apiRequest<VerifyOtpResponse>("/v1/auth/verify-otp", {
    method: "POST",
    body: payload,
  });
}

/** POST /v1/auth/logout — best-effort, server-side session revoke */
export async function logoutUser(
  refreshToken: string,
  accessToken: string
): Promise<void> {
  try {
    await apiRequest<MessageResponse>("/v1/auth/logout", {
      method: "POST",
      body: { refreshToken },
      token: accessToken,
    });
  } catch {
    // Best-effort — if server is unreachable we still clear locally
  }
}

// ---------------------------------------------------------------------------
// Password Reset
// ---------------------------------------------------------------------------

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

/** POST /v1/auth/forgot-password */
export async function forgotPassword(
  payload: ForgotPasswordPayload
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/v1/auth/forgot-password", {
    method: "POST",
    body: payload,
  });
}

/** POST /v1/auth/reset-password */
export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>("/v1/auth/reset-password", {
    method: "POST",
    body: payload,
  });
}
