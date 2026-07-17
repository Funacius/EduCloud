import { apiRequest } from './apiClient';
import type { ApiResponse } from '../types/api';
import type { LessonPayload, LessonRecord, LessonUpdatePayload } from '../types/course';

export function getLessons(courseId: string): Promise<ApiResponse<LessonRecord[]>> {
  return apiRequest(`/courses/${courseId}/lessons`);
}

export function createLesson(
  courseId: string,
  payload: LessonPayload
): Promise<ApiResponse<LessonRecord>> {
  return apiRequest(`/courses/${courseId}/lessons`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateLesson(
  lessonId: number,
  payload: LessonUpdatePayload
): Promise<ApiResponse<LessonRecord>> {
  return apiRequest(`/lessons/${lessonId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export function deleteLesson(lessonId: number): Promise<ApiResponse<{ id: number }>> {
  return apiRequest(`/lessons/${lessonId}`, {
    method: 'DELETE',
  });
}
