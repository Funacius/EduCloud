const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  // TODO Frontend Developer: Add auth token headers and centralized error handling.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  return response.json() as Promise<T>;
}
