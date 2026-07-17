import { apiRequest } from './apiClient';
import type { ApiResponse } from '../types/api';

export type StudentCourseSummary = {
  id: number;
  title: string;
  instructor: string;
  status: string;
  completed_lessons: number;
  total_lessons: number;
  percentage: number;
};

export type StudentDashboard = {
  active_courses: number;
  lessons_completed: number;
  completed_courses: number;
  courses: StudentCourseSummary[];
};

export function enrollCourse(courseId: string, token: string): Promise<ApiResponse<unknown>> {
  return apiRequest(`/courses/${courseId}/enroll`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
}

export function getMyCourses(token: string): Promise<ApiResponse<StudentDashboard>> {
  return apiRequest('/my-courses', { headers: { Authorization: `Bearer ${token}` } });
}
