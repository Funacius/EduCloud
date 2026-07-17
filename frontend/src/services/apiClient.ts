const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001/api';
const AUTH_SESSION_KEY = 'educloud-auth-session';

function readAccessToken(): string | null {
  try {
    const session = JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY) || 'null') as { token?: string } | null;
    return session?.token || null;
  } catch { return null; }
}

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const usesFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const token = readAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(usesFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const body = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    const detail = body?.detail;
    const fieldErrors: Record<string, string> = {};
    if (Array.isArray(detail)) {
      detail.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        const location = 'loc' in item && Array.isArray(item.loc) ? item.loc : [];
        const field = location.at(-1);
        const message = 'msg' in item && typeof item.msg === 'string' ? item.msg : '';
        if (typeof field === 'string' && message) fieldErrors[field] = message;
      });
    }
    const validationMessage = Array.isArray(detail)
      ? detail
        .map((item) => (
          item && typeof item === 'object' && 'msg' in item && typeof item.msg === 'string'
            ? item.msg
            : null
        ))
        .filter(Boolean)
        .join(' ')
      : '';
    const message = typeof detail === 'string'
      ? detail
      : validationMessage
        || (body && typeof body.message === 'string' ? body.message : '')
        || `Request failed with status ${response.status}.`;
    throw new ApiError(message, response.status, fieldErrors);
  }

  return body as T;
}
