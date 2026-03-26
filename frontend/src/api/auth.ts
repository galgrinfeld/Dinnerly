/**
 * Authentication API functions.
 */
import { apiFetch, setAccessToken } from "./http";
import { AuthResponse, UserRead, RegisterRequest, LoginRequest } from "../types/api";

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  // Store token (response uses camelCase: accessToken)
  if (response.accessToken) {
    setAccessToken(response.accessToken);
  }
  return response;
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  // Store token (response uses camelCase: accessToken)
  if (response.accessToken) {
    setAccessToken(response.accessToken);
  }
  return response;
}

export async function me(): Promise<UserRead> {
  return apiFetch<UserRead>("/api/auth/me");
}
