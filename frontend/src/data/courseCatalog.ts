import { getCourses } from '../services/courseService';
import type { Course, CourseRecord } from '../types/course';

const deprecatedSampleCourses: Course[] = [
  {
    id: 'course-1',
    title: 'Cloud Fundamentals',
    description: 'Learn the basic concepts of cloud computing and AWS infrastructure.',
    instructorName: 'EduCloud Lite Team',
    level: 'Beginner',
    category: 'Foundations',
    tags: ['Cloud', 'AWS'],
    duration: '4 lessons'
  },
  {
    id: 'course-2',
    title: 'Backend API Development',
    description: 'Build REST APIs for authentication, courses, lessons, enrollment, and progress tracking.',
    instructorName: 'EduCloud Lite Team',
    level: 'Beginner to Intermediate',
    category: 'Backend',
    tags: ['REST API', 'Learning Platform'],
    duration: '6 lessons'
  },
  {
    id: 'course-3',
    title: 'AWS S3 File Storage',
    description: 'Upload and manage course thumbnails, videos, and documents using AWS S3.',
    instructorName: 'EduCloud Lite Team',
    level: 'Intermediate',
    category: 'Cloud Storage',
    tags: ['S3', 'Files'],
    duration: '5 lessons'
  },
  {
    id: 'course-4',
    title: 'Database with AWS RDS',
    description: 'Store users, courses, lessons, enrollments, and progress data using PostgreSQL on AWS RDS.',
    instructorName: 'EduCloud Lite Team',
    level: 'Intermediate',
    category: 'Database',
    tags: ['RDS', 'PostgreSQL'],
    duration: '5 lessons'
  },
  {
    id: 'course-5',
    title: 'Monitoring with CloudWatch',
    description: 'Monitor backend logs, errors, and application activity using AWS CloudWatch.',
    instructorName: 'EduCloud Lite Team',
    level: 'Intermediate',
    category: 'Monitoring',
    tags: ['CloudWatch', 'Logs'],
    duration: '3 lessons'
  }
];

export function mapCourseRecord(course: CourseRecord): Course {
  return {
    id: String(course.id),
    title: course.title,
    description: course.description || 'Course details will be added soon.',
    instructorName: 'EduCloud Instructor',
    thumbnailUrl: course.thumbnail_url || undefined,
    level: course.level,
    category: course.category,
    tags: ['AWS', 'Cloud'],
    duration: 'Self-paced'
  };
}

export async function loadCourseCatalog(): Promise<Course[]> {
  const response = await getCourses();
  return (response.data ?? []).map(mapCourseRecord);
}
