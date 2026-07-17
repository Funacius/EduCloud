import { ArrowRight, Award, BookOpen, Clock3, PlayCircle, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const enrolledCourses = [
  {
    id: 'course-1',
    title: 'Cloud Fundamentals',
    instructor: 'EduCloud Lite Team',
    progress: 68,
    completed: 3,
    lessons: 4
  },
  {
    id: 'course-3',
    title: 'AWS S3 File Storage',
    instructor: 'Morgan Instructor',
    progress: 32,
    completed: 2,
    lessons: 5
  },
  {
    id: 'course-5',
    title: 'Monitoring with CloudWatch',
    instructor: 'EduCloud Lite Team',
    progress: 0,
    completed: 0,
    lessons: 3
  }
];

function MyLearningPage() {
  const { currentUser } = useAuth();

  return (
    <section className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Student workspace</span>
          <h1>Welcome back, {currentUser?.fullName.split(' ')[0]}</h1>
          <p>Pick up where you left off and keep your learning streak moving.</p>
        </div>
        <Link className="dashboard-primary-action" to="/courses">
          Browse courses
          <ArrowRight size={17} />
        </Link>
      </header>

      <div className="metric-grid metric-grid-three">
        <article className="metric-card">
          <span className="metric-icon metric-icon-blue"><BookOpen /></span>
          <div><strong>3</strong><span>Active courses</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon metric-icon-green"><Target /></span>
          <div><strong>5</strong><span>Lessons completed</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon metric-icon-amber"><Award /></span>
          <div><strong>1</strong><span>Certificate earned</span></div>
        </article>
      </div>

      <div className="dashboard-columns student-focus-grid">
        <section className="focus-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Continue learning</span>
              <h2>Cloud Fundamentals</h2>
            </div>
            <span className="progress-value">68%</span>
          </div>
          <p>Next: AWS global infrastructure and shared responsibility.</p>
          <div className="progress-track"><span style={{ width: '68%' }} /></div>
          <div className="focus-meta">
            <span><Clock3 size={16} /> 18 min remaining</span>
            <span>3 of 4 lessons</span>
          </div>
          <Link className="continue-button" to="/learn/course-1">
            <PlayCircle size={18} />
            Continue course
          </Link>
        </section>

        <aside className="achievement-panel">
          <Award size={30} />
          <span className="eyebrow">Latest achievement</span>
          <h2>AWS Learning Starter</h2>
          <p>Completed your first guided learning path.</p>
          <button type="button" className="text-button">View certificate</button>
        </aside>
      </div>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Your library</span>
            <h2>Enrolled courses</h2>
          </div>
          <span className="section-count">3 courses</span>
        </div>
        <div className="learning-course-list">
          {enrolledCourses.map((course) => (
            <article className="learning-course-row" key={course.id}>
              <div className="course-monogram">{course.title.slice(0, 2).toUpperCase()}</div>
              <div className="learning-course-copy">
                <h3>{course.title}</h3>
                <p>{course.instructor} · {course.completed} of {course.lessons} lessons</p>
                <div className="progress-track"><span style={{ width: `${course.progress}%` }} /></div>
              </div>
              <strong className="course-progress-number">{course.progress}%</strong>
              <Link className="icon-link" to={`/learn/${course.id}`} aria-label={`Open ${course.title}`}>
                <ArrowRight size={20} />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default MyLearningPage;
