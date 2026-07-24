import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import logoUrl from '../../image/logo.png';
import { getCourseById } from '../services/courseService';
import { enrollCourse } from '../services/enrollmentService';
import { useAuth } from '../auth/AuthContext';

type DetailCourse = {
  id: string;
  title: string;
  level: string;
  category: string;
  duration: string;
  videoCount: string;
  whatYouWillLearn: string[];
  lessons: string[];
  requirements: string[];
  thumbnailUrl?: string;
};

const courses: DetailCourse[] = [
  {
    id: 'course-1',
    title: 'Cloud Fundamentals',
    level: 'Beginner',
    category: 'Foundations',
    duration: '4 lessons',
    videoCount: '4 video lessons',
    whatYouWillLearn: [
      'Understand the basic concepts of cloud computing and AWS infrastructure.',
      'Identify core AWS services used in a learning management platform.',
      'Explain how compute, storage, database, and monitoring services work together.'
    ],
    lessons: ['Introduction to Cloud Computing', 'AWS Global Infrastructure', 'Core AWS Services', 'EduCloud Lite Architecture Overview'],
    requirements: ['Basic web development knowledge', 'A computer with internet access']
  },
  {
    id: 'course-2',
    title: 'Backend API Development',
    level: 'Beginner to Intermediate',
    category: 'Backend',
    duration: '6 lessons',
    videoCount: '6 video lessons',
    whatYouWillLearn: [
      'Design REST APIs for authentication, courses, lessons, enrollment, and progress tracking.',
      'Structure backend routes and services for an LMS workflow.',
      'Handle common API validation and error responses.'
    ],
    lessons: ['API Project Structure', 'Authentication APIs', 'Course and Lesson APIs', 'Enrollment APIs', 'Progress Tracking APIs', 'API Error Handling'],
    requirements: ['Basic JavaScript or TypeScript', 'Understanding of HTTP requests']
  },
  {
    id: 'course-3',
    title: 'AWS S3 File Storage',
    level: 'Intermediate',
    category: 'Cloud Storage',
    duration: '5 lessons',
    videoCount: '5 video lessons',
    whatYouWillLearn: [
      'Upload and manage course thumbnails, videos, and documents using AWS S3.',
      'Use secure file paths and object metadata for course materials.',
      'Connect uploaded files to lessons in EduCloud Lite.'
    ],
    lessons: ['S3 Bucket Basics', 'Upload Course Thumbnails', 'Upload Lesson Videos', 'Manage PDF Materials', 'Secure File Access'],
    requirements: ['AWS account access for deployment', 'Basic backend API knowledge']
  },
  {
    id: 'course-4',
    title: 'Database with AWS RDS',
    level: 'Intermediate',
    category: 'Database',
    duration: '5 lessons',
    videoCount: '5 video lessons',
    whatYouWillLearn: [
      'Model users, courses, lessons, enrollments, and progress data.',
      'Use PostgreSQL on AWS RDS for application persistence.',
      'Understand how LMS data relationships are stored.'
    ],
    lessons: ['EduCloud Data Model', 'Users and Roles', 'Courses and Lessons', 'Enrollments and Progress', 'RDS Deployment Notes'],
    requirements: ['Basic SQL knowledge', 'Understanding of relational database tables']
  },
  {
    id: 'course-5',
    title: 'Monitoring with CloudWatch',
    level: 'Intermediate',
    category: 'Monitoring',
    duration: '3 lessons',
    videoCount: '3 video lessons',
    whatYouWillLearn: [
      'Monitor backend logs, errors, and application activity using AWS CloudWatch.',
      'Understand useful log events for authentication and course workflows.',
      'Prepare an application for operational visibility on AWS.'
    ],
    lessons: ['CloudWatch Log Groups', 'Application Error Logs', 'Monitoring EduCloud Lite Activity'],
    requirements: ['Basic AWS service knowledge', 'A backend application ready to observe']
  }
];

type DetailIconProps = {
  name: 'level' | 'check' | 'clock' | 'video' | 'play';
};

function DetailIcon({ name }: DetailIconProps) {
  if (name === 'level') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4h10l-2 5 2 5H7l2-5-2-5Z" />
        <path d="M7 4v16" />
      </svg>
    );
  }

  if (name === 'clock') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6H8" />
      </svg>
    );
  }

  if (name === 'video') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 8h10v8H4z" />
        <path d="M14 11l5-3v8l-5-3" />
      </svg>
    );
  }

  if (name === 'play') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m8 5 11 7-11 7V5Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { currentUser, token } = useAuth();
  const staticCourse = undefined;
  const [course, setCourse] = useState<DetailCourse | null>(staticCourse ?? null);
  const [isLoading, setIsLoading] = useState(!staticCourse);
  const [error, setError] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    if (staticCourse || !courseId) {
      setCourse(staticCourse ?? null);
      setIsLoading(false);
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setError('');
    getCourseById(courseId)
      .then((response) => {
        if (!isActive || !response.data) return;
        const record = response.data;
        const lessonCount = record.lessons.length;
        const videoCount = record.lessons.filter((lesson) => lesson.has_video).length;
        setCourse({
          id: String(record.id),
          title: record.title,
          level: record.level,
          category: record.category,
          duration: lessonCount > 0 ? `${lessonCount} lessons` : 'Self-paced',
          videoCount: `${videoCount} video ${videoCount === 1 ? 'lesson' : 'lessons'}`,
          whatYouWillLearn: record.learning_outcomes.length > 0
            ? record.learning_outcomes
            : [record.description || 'Course learning outcomes will be added by the instructor.'],
          lessons: record.lessons.map((lesson) => lesson.title),
          requirements: record.requirements.length > 0
            ? record.requirements
            : ['No prerequisites are required.'],
          thumbnailUrl: record.thumbnail_url || undefined
        });
      })
      .catch((caughtError) => {
        if (isActive) {
          setError(caughtError instanceof Error ? caughtError.message : 'Unable to load this course.');
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [courseId, staticCourse]);

  if (isLoading) {
    return <section className="course-detail-state">Loading course...</section>;
  }

  if (error || !course) {
    return (
      <section className="course-detail-state course-detail-error">
        <strong>{error || 'Course not found.'}</strong>
        <Link to="/courses">Back to courses</Link>
      </section>
    );
  }

  const startCourse = async () => {
    if (!currentUser || !token) {
      navigate('/login', { state: { from: `/courses/${course.id}` } });
      return;
    }
    if (currentUser.role !== 'student') return;
    setIsEnrolling(true);
    try {
      await enrollCourse(course.id, token);
      navigate(`/learn/${course.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to enroll in this course.');
      setIsEnrolling(false);
    }
  };

  return (
    <section className="course-detail-page">
      <div className="detail-hero">
        <div>
          <h1>{course.title}</h1>
          <ul className="detail-meta">
            <li>
              <DetailIcon name="level" />
              <span>Level: {course.level}</span>
            </li>
            <li>
              <DetailIcon name="check" />
              <span>Category: <strong>{course.category}</strong></span>
            </li>
            <li>
              <DetailIcon name="clock" />
              <span>{course.duration}</span>
            </li>
          </ul>
        </div>
        <div className="detail-thumb" aria-hidden="true">
          <img
            className={course.thumbnailUrl ? 'has-course-thumbnail' : undefined}
            src={course.thumbnailUrl || logoUrl}
            alt=""
            onError={(event) => {
              event.currentTarget.src = logoUrl;
            }}
          />
        </div>
      </div>

      <div className="detail-body">
        <div className="learn-panel">
          <h2>What you'll learn</h2>
          <ul>
            {course.whatYouWillLearn.map((item) => (
              <li key={item}>
                <DetailIcon name="check" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="includes-card">
          <h2>This course includes</h2>
          <div className="includes-row">
            <DetailIcon name="video" />
            <span>{course.videoCount}</span>
          </div>
          <div className="includes-actions">
            <button className="start-course-button" type="button" onClick={() => void startCourse()} disabled={isEnrolling || Boolean(currentUser && currentUser.role !== 'student')}>
              {isEnrolling ? 'Enrolling...' : currentUser?.role && currentUser.role !== 'student' ? 'Student access only' : 'Start Course'}
            </button>
          </div>
        </aside>

        <section className="detail-section course-content-panel">
          <h2>Course content</h2>
          <div className="lesson-group">
            <div className="lesson-group-title">
              <DetailIcon name="play" />
              <strong>{course.title}</strong>
            </div>
            <ul>
              {course.lessons.length > 0
                ? course.lessons.map((lesson) => <li key={lesson}>{lesson}</li>)
                : <li>Lessons will be added by the instructor.</li>}
            </ul>
          </div>
        </section>

        <section className="detail-section requirements-panel">
          <h2>Requirements</h2>
          <ul>
            {course.requirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}

export default CourseDetailPage;
