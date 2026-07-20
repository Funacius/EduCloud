import { apiRequest } from './apiClient';
import type { ApiResponse } from '../types/api';
import type { ApiUser, AuthResult } from '../types/user';

export function registerUser(payload: { full_name: string; email: string; password: string }): Promise<ApiResponse<AuthResult>> {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function loginUser(payload: { email: string; password: string }): Promise<ApiResponse<AuthResult>> {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function exchangeCognitoToken(idToken: string): Promise<ApiResponse<AuthResult>> {
  return apiRequest('/auth/cognito/exchange', {
    method: 'POST',
    body: JSON.stringify({ id_token: idToken })
  });
}

export function requestPasswordReset(email: string): Promise<ApiResponse<{ accepted: boolean }>> {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase() })
  });
}

export function getCurrentUser(token: string): Promise<ApiResponse<ApiUser>> {
  return apiRequest('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
}
