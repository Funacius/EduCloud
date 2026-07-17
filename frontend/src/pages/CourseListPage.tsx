import { Link } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import { useAuth } from '../auth/AuthContext';

const sampleCourses = [
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

function CourseListPage() {
  const { currentUser } = useAuth();

  const roleAction = currentUser?.role === 'student'
    ? { to: '/my-learning', label: 'Continue Learning' }
    : currentUser?.role === 'instructor'
      ? { to: '/instructor/courses', label: 'Manage Courses' }
      : currentUser?.role === 'admin'
        ? { to: '/admin', label: 'Open Admin Dashboard' }
        : { to: '/login', label: 'Sign in' };

  return (
    <>
      <section className="hero">
        <div className="hero-art" aria-hidden="true">
          <span className="beam beam-one" />
          <span className="beam beam-two" />
          <span className="beam beam-three" />
          <span className="toolbox">Learn on AWS</span>
        </div>
        <div className="hero-inner">
          <h1>EduCloud Lite</h1>
          <p>
            A cloud-based learning management platform that helps students browse courses, enroll in
            classes, access lessons and materials, and track their learning progress. Built with modern
            web technologies and AWS services such as S3, RDS, EC2/Lambda, CloudWatch, and IAM.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#available-courses">Browse Courses</a>
            <Link className="secondary-action" to={roleAction.to}>{roleAction.label}</Link>
          </div>
        </div>
      </section>

      <section className="features" aria-label="Platform highlights">
        <div className="feature">
          <span className="feature-icon">CM</span>
          <div>
            <h2>Course Management</h2>
            <p>Create, manage, and organize online courses and lessons.</p>
          </div>
        </div>
        <div className="feature">
          <span className="feature-icon">IL</span>
          <div>
            <h2>Interactive Learning</h2>
            <p>Students can access lessons, documents, videos, and learning materials.</p>
          </div>
        </div>
        <div className="feature">
          <span className="feature-icon">PT</span>
          <div>
            <h2>Progress Tracking</h2>
            <p>Track completed lessons and monitor learning progress.</p>
          </div>
        </div>
        <div className="feature">
          <span className="feature-icon">S3</span>
          <div>
            <h2>Cloud Storage</h2>
            <p>Store thumbnails, videos, and PDF materials using AWS S3.</p>
          </div>
        </div>
        <div className="feature">
          <span className="feature-icon">CW</span>
          <div>
            <h2>Monitoring</h2>
            <p>Use AWS CloudWatch to observe logs, errors, and system activity.</p>
          </div>
        </div>
        <div className="feature">
          <span className="feature-icon">RA</span>
          <div>
            <h2>Role-Based Access</h2>
            <p>Support Student, Instructor, and Admin roles with secure authentication.</p>
          </div>
        </div>
      </section>

      <section className="courses-section" id="available-courses">
        <h2>Available courses</h2>
        <div className="title-rule" />
        <div className="course-list">
          {sampleCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>
    </>
  );
}

export default CourseListPage;
