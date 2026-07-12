import { apiRequest } from './apiClient';
import type { ApiResponse } from '../types/api';
import type { User } from '../types/user';

export function registerUser(payload: unknown): Promise<ApiResponse<User>> {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// Sửa lại hàm loginUser để gửi dạng Form Data cho khớp với Backend
export function loginUser(payload: { username: string; password: string }): Promise<ApiResponse<{ access_token: string }>> {
  const formData = new URLSearchParams();
  formData.append('username', payload.username);
  formData.append('password', payload.password);

  // Gọi fetch trực tiếp với Content-Type là x-www-form-urlencoded
  return fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData
  }).then(res => res.json());
}

export function getCurrentUser(): Promise<ApiResponse<User>> {
  return apiRequest('/auth/me');
}