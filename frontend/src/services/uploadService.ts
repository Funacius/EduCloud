import { apiRequest } from './apiClient';
import type { ApiResponse } from '../types/api';


export type UploadResult = {
  url: string;
  filename: string;
  content_type: string;
  size: number;
  storage: 'local' | 's3';
};

function uploadFile(path: string, file: File, courseId: string): Promise<ApiResponse<UploadResult>> {
  const body = new FormData();
  body.append('course_id', courseId);
  body.append('file', file);
  return apiRequest(path, {
    method: 'POST',
    body
  });
}

export function uploadCourseThumbnail(file: File, courseId: string) {
  return uploadFile('/upload/course-thumbnail', file, courseId);
}

export function uploadLessonMaterial(file: File, courseId: string) {
  return uploadFile('/upload/lesson-material', file, courseId);
}

export function uploadVideo(file: File, courseId: string) {
  return uploadFile('/upload/video', file, courseId);
}
