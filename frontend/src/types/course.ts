export type Course = {
  id: string;
  title: string;
  description: string;
  instructorName: string;
  thumbnailUrl?: string;
  level?: number | string;
  category?: string;
  tags?: string[];
  duration?: string;
};

export type CourseStatus = 'draft' | 'published' | 'hidden' | 'archived';

export type CourseRecord = {
  id: number;
  title: string;
  description: string | null;
  level: string;
  category: string;
  learning_outcomes: string[];
  requirements: string[];
  thumbnail_url: string | null;
  price: number;
  status: CourseStatus;
  instructor_id: number;
  created_at: string;
  updated_at: string;
};

export type LessonRecord = {
  id: number;
  course_id: number;
  title: string;
  content: string | null;
  video_url: string | null;
  material_url: string | null;
  order_index: number;
};

export type LessonPayload = {
  title: string;
  content?: string;
  video_url?: string;
  material_url?: string;
  order_index: number;
};

export type LessonUpdatePayload = Partial<LessonPayload>;

export type CourseDetailRecord = CourseRecord & {
  lessons: LessonRecord[];
};

export type CourseCreatePayload = {
  title: string;
  description?: string;
  level: string;
  category: string;
  learning_outcomes: string[];
  requirements: string[];
  thumbnail_url?: string;
  price: number;
  status: Exclude<CourseStatus, 'archived'>;
};

export type CourseUpdatePayload = Partial<CourseCreatePayload>;
