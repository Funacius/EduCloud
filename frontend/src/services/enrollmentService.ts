import { apiRequest } from './apiClient';
import type { ApiResponse } from '../types/api';
import type { Course } from '../types/course';

export function enrollCourse(courseId: string): Promise<ApiResponse<unknown>> {
  // TODO Frontend Developer: Call this from CourseDetailPage.
  return apiRequest(`/courses/${courseId}/enroll`, { method: 'POST' });
}

export function getMyCourses(): Promise<ApiResponse<Course[]>> {
  return apiRequest('/my-courses');
}
