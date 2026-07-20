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
  pending_instructor_requests: number;
  recent_users: ApiUser[];
};

export function getAdminDashboard(token: string): Promise<ApiResponse<AdminDashboard>> {
  return apiRequest('/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } });
}

export type HealthDashboard = {
  status: 'operational' | 'degraded';
  checked_at: string;
  uptime_seconds: number;
  database: {
    status: string;
    engine?: string;
    latency_ms?: number;
    size_bytes?: number | null;
    rows: Record<string, number>;
    error?: string;
  };
  traffic: {
    total_requests_since_start: number;
    requests_last_5_minutes: number;
    errors_last_5_minutes: number;
    client_errors_last_5_minutes: number;
    average_response_ms_last_5_minutes: number;
    top_routes: Array<{ path: string; requests: number }>;
  };
  storage: {
    mode: string;
    local_size_bytes: number;
    s3_configured: boolean;
    s3_bucket: string | null;
    s3_size_bytes: number | null;
    s3_object_count: number | null;
  };
  aws: {
    monitoring_enabled: boolean;
    estimated_month_cost_usd: number | null;
    credits_applied_this_month_usd: number | null;
    message: string;
  };
  services: Array<{ name: string; status: string; detail: string }>;
};

export function getHealthDashboard(): Promise<ApiResponse<HealthDashboard>> {
  return apiRequest('/admin/health');
}

export type AdminCourseOversight = {
  id: number;
  title: string;
  status: 'draft' | 'published' | 'hidden' | 'archived';
  instructor_name: string;
  enrollments: number;
  certificates: number;
  can_publish: boolean;
  publish_blockers: string[];
  updated_at: string;
};

export function getAdminCourses(): Promise<ApiResponse<AdminCourseOversight[]>> {
  return apiRequest('/admin/courses');
}
