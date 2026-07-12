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
