import { Link } from 'react-router-dom';
import type { Course } from '../types/course';
import logoUrl from '../../image/logo.png';

type CourseCardProps = {
  course: Course;
};

type IconProps = {
  name: 'level' | 'check' | 'clock' | 'arrow';
};

function CourseIcon({ name }: IconProps) {
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

  if (name === 'arrow') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function CourseCard({ course }: CourseCardProps) {
  return (
    <article className="course-card">
      <div className="course-main">
        <div className="course-content">
          <h3>{course.title}</h3>
          <ul className="course-meta">
            <li>
              <CourseIcon name="level" />
              <span>Level: {course.level ?? 'Beginner'}</span>
            </li>
            <li>
              <CourseIcon name="check" />
              <span>Category: <strong>{course.category ?? 'Community'}</strong></span>
            </li>
            <li>
              <CourseIcon name="check" />
              <span>Tag: {(course.tags ?? ['EduCloud', 'AWS']).join(', ')}</span>
            </li>
            <li>
              <CourseIcon name="clock" />
              <span>{course.duration ?? 'Self-paced'}</span>
            </li>
          </ul>
        </div>
        <div className="course-thumb" aria-hidden="true">
          <img src={course.thumbnailUrl ?? logoUrl} alt="" />
        </div>
      </div>
      <div className="course-actions">
        <Link className="course-link" to={`/courses/${course.id}`}>
          Get Started
          <CourseIcon name="arrow" />
        </Link>
      </div>
    </article>
  );
}

export default CourseCard;
