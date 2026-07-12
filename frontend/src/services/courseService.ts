import { apiRequest } from './apiClient';
import type { ApiResponse } from '../types/api';
import type { Course } from '../types/course';

export function getCourses(): Promise<ApiResponse<Course[]>> {
  // TODO Frontend Developer: Use this in CourseListPage.
  return apiRequest('/courses');
}

export function getCourseById(courseId: string): Promise<ApiResponse<Course>> {
  return apiRequest(`/courses/${courseId}`);
}

export function createCourse(payload: unknown): Promise<ApiResponse<Course>> {
  return apiRequest('/courses', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
