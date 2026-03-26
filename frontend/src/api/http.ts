/**
 * HTTP utility for API calls with JWT authentication.
 */

// Token storage helpers
const TOKEN_KEY = "accessToken";

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add authorization header if token exists
  const token = getAccessToken();
  if (token) {
    (defaultHeaders as any)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options?.headers || {}),
    },
  });

  // Handle 401 - clear token and redirect to login
  if (response.status === 401) {
    clearAccessToken();
    window.location.assign("/login");
    return {} as T;
  }

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const data = await response.json();
      errorMessage = data.detail || data.message || errorMessage;
    } catch {
      // Fallback to status text if not JSON
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content - return empty object
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
