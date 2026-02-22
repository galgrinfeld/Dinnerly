/**
 * HTTP utility for API calls.
 */
export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  const response = await fetch(path, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options?.headers || {}),
    },
  });

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
