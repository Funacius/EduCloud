export type Lesson = {
  id: string;
  courseId: string;
  title: string;
  content: string;
  videoUrl?: string;
  materialUrl?: string;
  order: number;
};
