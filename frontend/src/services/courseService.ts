import { apiRequest } from './apiClient';
import type { ApiResponse } from '../types/api';
import type {
  CourseCreatePayload,
  ManagedCourseDetailRecord,
  PublicCourseDetailRecord,
  InstructorCourseRecord,
  CourseRecord,
  CourseUpdatePayload
} from '../types/course';

export function getCourses(): Promise<ApiResponse<CourseRecord[]>> {
  return apiRequest('/courses');
}

export function getCourseById(courseId: string): Promise<ApiResponse<PublicCourseDetailRecord>> {
  return apiRequest(`/courses/${courseId}`);
}

export function getManagedCourse(courseId: string): Promise<ApiResponse<ManagedCourseDetailRecord>> {
  return apiRequest(`/courses/${courseId}/manage`);
}

export function getLearningCourse(courseId: string): Promise<ApiResponse<ManagedCourseDetailRecord>> {
  return apiRequest(`/courses/${courseId}/learning`);
}

export function deleteCourse(courseId: string): Promise<ApiResponse<{ id: number }>> {
  return apiRequest(`/courses/${courseId}`, { method: 'DELETE' });
}

export function getInstructorCourses(): Promise<ApiResponse<InstructorCourseRecord[]>> {
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
