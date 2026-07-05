import { apiRequest } from './apiClient';
import type { ApiResponse } from '../types/api';
import type { User } from '../types/user';

export function registerUser(payload: unknown): Promise<ApiResponse<User>> {
  // TODO Frontend Developer: Replace unknown payload with a typed register form.
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function loginUser(payload: unknown): Promise<ApiResponse<{ token: string }>> {
  // TODO Frontend Developer: Save token after successful login.
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getCurrentUser(): Promise<ApiResponse<User>> {
  return apiRequest('/auth/me');
}
