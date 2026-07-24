import { apiRequest } from './apiClient';
import type { ApiResponse } from '../types/api';

export type AssessmentQuestionEditor = {
  id?: number;
  prompt: string;
  options: string[];
  correct_option_index: number | null;
  correct_option_indices: number[];
  answer_mode: 'all' | 'any';
  explanation: string | null;
  order_index: number;
};

export type InstructorAssessment = {
  id: number | null;
  course_id: number;
  title: string;
  instructions: string | null;
  time_limit_minutes: number;
  passing_score: number;
  max_attempts: number;
  is_published: boolean;
  questions: AssessmentQuestionEditor[];
};

export type StudentAssessmentQuestion = {
  id: number;
  prompt: string;
  options: string[];
  answer_mode: 'all' | 'any';
  allows_multiple: boolean;
  order_index: number;
};

export type StudentAssessment = {
  id: number;
  course_id: number;
  course_title: string;
  title: string;
  instructions: string | null;
  time_limit_minutes: number;
  passing_score: number;
  max_attempts: number;
  attempts_used: number;
  lessons_completed: number;
  total_lessons: number;
  eligible: boolean;
  passed: boolean;
  active_attempt_id: number | null;
  expires_at: string | null;
  questions: StudentAssessmentQuestion[];
};

export type AssessmentStart = { attempt_id: number; attempt_number: number; expires_at: string };
export type AssessmentResult = {
  attempt_id: number;
  score: number;
  passed: boolean;
  passing_score: number;
  correct_answers: number;
  total_questions: number;
  certificate_issued: boolean;
};

export function getInstructorAssessment(courseId: string): Promise<ApiResponse<InstructorAssessment>> {
  return apiRequest(`/instructor/courses/${courseId}/assessment`);
}

export function saveInstructorAssessment(courseId: string, payload: Omit<InstructorAssessment, 'id' | 'course_id'>): Promise<ApiResponse<InstructorAssessment>> {
  return apiRequest(`/instructor/courses/${courseId}/assessment`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function getStudentAssessment(courseId: string): Promise<ApiResponse<StudentAssessment>> {
  return apiRequest(`/courses/${courseId}/assessment`);
}

export function startStudentAssessment(courseId: string): Promise<ApiResponse<AssessmentStart>> {
  return apiRequest(`/courses/${courseId}/assessment/start`, { method: 'POST' });
}

export function submitStudentAssessment(
  courseId: string,
  attemptId: number,
  answers: Record<number, number[]>
): Promise<ApiResponse<AssessmentResult>> {
  return apiRequest(`/courses/${courseId}/assessment/submit`, {
    method: 'POST',
    body: JSON.stringify({
      attempt_id: attemptId,
      answers: Object.entries(answers).map(([questionId, selectedOptionIndices]) => ({
        question_id: Number(questionId),
        selected_option_indices: selectedOptionIndices
      }))
    })
  });
}
