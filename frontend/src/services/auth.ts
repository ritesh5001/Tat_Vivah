import { COOKIE_ATTRIBUTES_SUFFIX } from "@/lib/site-config";

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

export interface RegisterSellerPayload {
  email: string;
  phone: string;
  whatsappNumber: string;
  password: string;
}

export interface RegisterAdminPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
  designation?: string;
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

export interface OtpRequestResponse {
  message: string;
}

export interface VerifyOtpResponse {
  message?: string;
  user?: {
    id: string;
    email: string | null;
    phone: string | null;
    role: string;
    status: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
  };
  accessToken?: string;
  refreshToken?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function clearAuthSession(): void {
  if (typeof document === "undefined") return;
  document.cookie = `tatvivah_access=; path=/; max-age=0${COOKIE_ATTRIBUTES_SUFFIX}`;
  document.cookie = `tatvivah_refresh=; path=/; max-age=0${COOKIE_ATTRIBUTES_SUFFIX}`;
  document.cookie = `tatvivah_role=; path=/; max-age=0${COOKIE_ATTRIBUTES_SUFFIX}`;
  document.cookie = `tatvivah_user=; path=/; max-age=0${COOKIE_ATTRIBUTES_SUFFIX}`;
  window.dispatchEvent(new Event("tatvivah-auth"));
}

/**
 * Store all auth cookies after a successful login / token refresh.
 */
export function persistAuthCookies(
  accessToken: string,
  refreshToken: string,
  user: { role: string;[key: string]: unknown }
): void {
  document.cookie = `tatvivah_access=${accessToken}; path=/; max-age=86400${COOKIE_ATTRIBUTES_SUFFIX}`;
  document.cookie = `tatvivah_refresh=${refreshToken}; path=/; max-age=604800${COOKIE_ATTRIBUTES_SUFFIX}`;
  document.cookie = `tatvivah_role=${user.role}; path=/; max-age=86400${COOKIE_ATTRIBUTES_SUFFIX}`;
  document.cookie = `tatvivah_user=${encodeURIComponent(
    JSON.stringify(user)
  )}; path=/; max-age=86400${COOKIE_ATTRIBUTES_SUFFIX}`;
  window.dispatchEvent(new Event("tatvivah-auth"));
}

export function signOut(redirectTo: string = "/login?force=1"): void {
  if (typeof window === "undefined") return;
  clearAuthSession();
  // Full redirect ensures middleware + layouts pick up logged-out state everywhere.
  window.location.assign(redirectTo);
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured");
  }

  const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.message ?? data?.message ?? "Login failed";
    throw new Error(message);
  }

  return data as LoginResponse;
}

export async function registerUser(
  payload: RegisterUserPayload
): Promise<RegisterResponse> {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured");
  }

  const response = await fetch(`${API_BASE_URL}/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.message ?? data?.message ?? "Registration failed";
    throw new Error(message);
  }

  return data as RegisterResponse;
}

export async function registerSeller(
  payload: RegisterSellerPayload
): Promise<RegisterResponse> {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured");
  }

  const response = await fetch(`${API_BASE_URL}/v1/seller/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.message ?? data?.message ?? "Seller registration failed";
    throw new Error(message);
  }

  return data as RegisterResponse;
}

export async function registerAdmin(
  payload: RegisterAdminPayload
): Promise<RegisterResponse> {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured");
  }

  const response = await fetch(`${API_BASE_URL}/v1/auth/admin/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.message ?? data?.message ?? "Admin registration failed";
    throw new Error(message);
  }

  return data as RegisterResponse;
}

export async function requestPhoneOtp(phone: string): Promise<OtpRequestResponse> {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured");
  }

  const response = await fetch(`${API_BASE_URL}/v1/auth/request-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.message ?? data?.message ?? "OTP request failed";
    throw new Error(message);
  }

  return data as OtpRequestResponse;
}

export async function verifyPhoneOtp(payload: {
  phone: string;
  otp: string;
}): Promise<VerifyOtpResponse> {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured");
  }

  const response = await fetch(`${API_BASE_URL}/v1/auth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.message ?? data?.message ?? "OTP verification failed";
    throw new Error(message);
  }

  return data as VerifyOtpResponse;
}

// ---------------------------------------------------------------------------
// Password Reset
// ---------------------------------------------------------------------------

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

/** POST /v1/auth/forgot-password */
export async function forgotPassword(
  email: string
): Promise<ForgotPasswordResponse> {
  if (!API_BASE_URL) throw new Error("API base URL is not configured");

  const response = await fetch(`${API_BASE_URL}/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data?.error?.message ?? data?.message ?? "Request failed"
    );
  }
  return data as ForgotPasswordResponse;
}

/** POST /v1/auth/reset-password */
export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> {
  if (!API_BASE_URL) throw new Error("API base URL is not configured");

  const response = await fetch(`${API_BASE_URL}/v1/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      data?.error?.message ?? data?.message ?? "Password reset failed"
    );
  }
  return data as ResetPasswordResponse;
}
