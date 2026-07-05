import { Link } from 'react-router-dom';
import type { Course } from '../types/course';

type CourseCardProps = {
  course: Course;
};

function CourseCard({ course }: CourseCardProps) {
  return (
    <article className="card">
      <h2>{course.title}</h2>
      <p>{course.description}</p>
      <small>Instructor: {course.instructorName}</small>
      <Link to={`/courses/${course.id}`}>View Details</Link>
    </article>
  );
}

export default CourseCard;
