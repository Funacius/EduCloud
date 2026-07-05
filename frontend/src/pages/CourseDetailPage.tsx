import { useParams } from 'react-router-dom';

function CourseDetailPage() {
  const { courseId } = useParams();

  return (
    <section className="page">
      <h1>Course Detail</h1>
      <p>Course ID: {courseId}</p>
      <p>TODO Frontend Developer: Show course lessons, instructor, thumbnail, and enroll button.</p>
      <button type="button">Enroll</button>
    </section>
  );
}

export default CourseDetailPage;
