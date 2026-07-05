import CourseCard from '../components/CourseCard';

const sampleCourses = [
  {
    id: 'course-1',
    title: 'AWS Cloud Basics',
    description: 'Learn core AWS concepts with simple lessons.',
    instructorName: 'Demo Instructor'
  }
];

function CourseListPage() {
  return (
    <section className="page">
      <h1>Courses</h1>
      <p>TODO Frontend Developer: Load courses from the backend API.</p>
      <div className="grid">
        {sampleCourses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}

export default CourseListPage;
