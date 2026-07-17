import { apiRequest } from './apiClient';
import type { ApiResponse } from '../types/api';

export type CourseProgress = {
  course_id: number;
  completed_lessons: number;
  total_lessons: number;
  percentage: number;
  completed_lesson_ids: number[];
};

export function getCourseProgress(courseId: string): Promise<ApiResponse<CourseProgress>> {
  return apiRequest(`/courses/${courseId}/progress`);
}

export function setLessonComplete(lessonId: number, completed: boolean): Promise<ApiResponse<unknown>> {
  return apiRequest(`/lessons/${lessonId}/complete`, { method: completed ? 'POST' : 'DELETE' });
}
