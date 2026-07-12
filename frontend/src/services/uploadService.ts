import { apiRequest } from './apiClient';
import type { ApiResponse } from '../types/api';

export function uploadCourseThumbnail(_file: File): Promise<ApiResponse<{ url: string }>> {
  // TODO Frontend Developer: Use FormData when upload endpoint is implemented.
  return apiRequest('/upload/course-thumbnail', { method: 'POST' });
}

export function uploadLessonMaterial(_file: File): Promise<ApiResponse<{ url: string }>> {
  return apiRequest('/upload/lesson-material', { method: 'POST' });
}

export function uploadVideo(_file: File): Promise<ApiResponse<{ url: string }>> {
  return apiRequest('/upload/video', { method: 'POST' });
}
