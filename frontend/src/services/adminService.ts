import { apiRequest } from './apiClient';
import type { ApiResponse } from '../types/api';
import type { ApiUser } from '../types/user';

export type AdminDashboard = {
  total_users: number;
  students: number;
  instructors: number;
  admins: number;
  published_courses: number;
  draft_courses: number;
  total_lessons: number;
  total_enrollments: number;
  recent_users: ApiUser[];
};

export function getAdminDashboard(token: string): Promise<ApiResponse<AdminDashboard>> {
  return apiRequest('/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } });
}
