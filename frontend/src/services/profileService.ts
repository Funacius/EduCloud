import { apiRequest } from './apiClient';
import type { ApiResponse } from '../types/api';

export type Certificate = {
  id: number;
  certificate_code: string;
  course_id: number;
  recipient_name: string;
  course_title: string;
  file_url: string | null;
  issued_at: string;
};

export type StudentProfile = {
  id: number | null;
  user_id: number;
  email: string;
  full_name: string;
  certificate_name: string;
  date_of_birth: string | null;
  organization: string | null;
  country: string | null;
  bio: string | null;
  is_complete: boolean;
  certificates: Certificate[];
};

export type StudentProfilePayload = Pick<StudentProfile, 'certificate_name' | 'date_of_birth' | 'organization' | 'country' | 'bio'>;

export function getStudentProfile(): Promise<ApiResponse<StudentProfile>> {
  return apiRequest('/profile');
}

export function updateStudentProfile(payload: StudentProfilePayload): Promise<ApiResponse<StudentProfile>> {
  return apiRequest('/profile', { method: 'PUT', body: JSON.stringify(payload) });
}
