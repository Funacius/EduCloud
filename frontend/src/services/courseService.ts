import { apiRequest } from './apiClient';
import type { ApiResponse } from '../types/api';
import type {
  CourseCreatePayload,
  CourseDetailRecord,
  CourseRecord,
  CourseUpdatePayload
} from '../types/course';

export function getCourses(): Promise<ApiResponse<CourseRecord[]>> {
  return apiRequest('/courses');
}

export function getCourseById(courseId: string): Promise<ApiResponse<CourseDetailRecord>> {
  return apiRequest(`/courses/${courseId}`);
}

export function getInstructorCourses(): Promise<ApiResponse<CourseRecord[]>> {
  return apiRequest('/courses/mine');
}

export function createCourse(payload: CourseCreatePayload): Promise<ApiResponse<CourseRecord>> {
  return apiRequest('/courses', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateCourse(
  courseId: string,
  payload: CourseUpdatePayload
): Promise<ApiResponse<CourseRecord>> {
  return apiRequest(`/courses/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}
