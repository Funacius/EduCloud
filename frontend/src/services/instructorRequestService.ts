import { apiRequest } from './apiClient';
import type { ApiResponse } from '../types/api';

export type InstructorRequestStatus = 'pending' | 'approved' | 'rejected';

export type InstructorRequest = {
  id: number;
  user_id: number;
  applicant_name: string;
  applicant_email: string;
  organization: string;
  expertise: string;
  experience: string;
  bio: string;
  portfolio_url: string | null;
  status: InstructorRequestStatus;
  review_note: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InstructorRequestPayload = Pick<
  InstructorRequest,
  'organization' | 'expertise' | 'experience' | 'bio' | 'portfolio_url'
>;

export function getMyInstructorRequest(): Promise<ApiResponse<InstructorRequest | null>> {
  return apiRequest('/instructor-requests/me');
}

export function submitInstructorRequest(payload: InstructorRequestPayload): Promise<ApiResponse<InstructorRequest>> {
  return apiRequest('/instructor-requests', { method: 'POST', body: JSON.stringify(payload) });
}

export function getInstructorRequests(status = 'pending'): Promise<ApiResponse<InstructorRequest[]>> {
  return apiRequest(`/admin/instructor-requests?status=${encodeURIComponent(status)}`);
}

export function reviewInstructorRequest(
  requestId: number,
  decision: 'approve' | 'reject',
  reviewNote: string
): Promise<ApiResponse<InstructorRequest>> {
  return apiRequest(`/admin/instructor-requests/${requestId}/${decision}`, {
    method: 'PUT',
    body: JSON.stringify({ review_note: reviewNote || null })
  });
}
