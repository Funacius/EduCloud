import { useParams } from 'react-router-dom';

function LearningPage() {
  const { courseId } = useParams();

  return (
    <section className="page">
      <h1>Learning Page</h1>
      <p>Course ID: {courseId}</p>
      <p>TODO Frontend Developer: Show lesson content, video/material links, and complete button.</p>
      <button type="button">Mark Lesson Complete</button>
    </section>
  );
}

export default LearningPage;
