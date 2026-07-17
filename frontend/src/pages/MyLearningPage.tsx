import { ArrowRight, Award, BookOpen, Clock3, PlayCircle, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getMyCourses, type StudentDashboard } from '../services/enrollmentService';

const emptyDashboard: StudentDashboard = { active_courses: 0, lessons_completed: 0, completed_courses: 0, courses: [] };

function MyLearningPage() {
  const { currentUser, token } = useAuth();
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    getMyCourses(token)
      .then((response) => active && setDashboard(response.data ?? emptyDashboard))
      .catch((caught) => active && setError(caught instanceof Error ? caught.message : 'Unable to load learning data.'))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [token]);

  const focus = dashboard.courses.find((course) => course.percentage < 100) ?? dashboard.courses[0];

  return (
    <section className="dashboard-page">
      <header className="dashboard-header">
        <div><span className="eyebrow">Student workspace</span><h1>Welcome back, {currentUser?.fullName.split(' ')[0]}</h1><p>Pick up where you left off and keep your learning streak moving.</p></div>
        <Link className="dashboard-primary-action" to="/courses">Browse courses <ArrowRight size={17} /></Link>
      </header>

      {error && <p className="form-error">{error}</p>}
      <div className="metric-grid metric-grid-three">
        <article className="metric-card"><span className="metric-icon metric-icon-blue"><BookOpen /></span><div><strong>{isLoading ? '—' : dashboard.active_courses}</strong><span>Active courses</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon-green"><Target /></span><div><strong>{isLoading ? '—' : dashboard.lessons_completed}</strong><span>Lessons completed</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon-amber"><Award /></span><div><strong>{isLoading ? '—' : dashboard.completed_courses}</strong><span>Courses completed</span></div></article>
      </div>

      {focus && <div className="dashboard-columns student-focus-grid">
        <section className="focus-panel">
          <div className="section-heading"><div><span className="eyebrow">Continue learning</span><h2>{focus.title}</h2></div><span className="progress-value">{focus.percentage}%</span></div>
          <p>Continue with the next available lesson in this course.</p>
          <div className="progress-track"><span style={{ width: `${focus.percentage}%` }} /></div>
          <div className="focus-meta"><span><Clock3 size={16} /> Self-paced</span><span>{focus.completed_lessons} of {focus.total_lessons} lessons</span></div>
          <Link className="continue-button" to={`/learn/${focus.id}`}><PlayCircle size={18} />Continue course</Link>
        </section>
        <aside className="achievement-panel"><Award size={30} /><span className="eyebrow">Course completion</span><h2>{dashboard.completed_courses ? 'Achievement unlocked' : 'Keep learning'}</h2><p>{dashboard.completed_courses ? `You have completed ${dashboard.completed_courses} course(s).` : 'Complete every lesson in a course to earn an achievement.'}</p></aside>
      </div>}

      <section className="dashboard-section">
        <div className="section-heading"><div><span className="eyebrow">Your library</span><h2>Enrolled courses</h2></div><span className="section-count">{dashboard.courses.length} {dashboard.courses.length === 1 ? 'course' : 'courses'}</span></div>
        {isLoading ? <div className="dashboard-empty-state">Loading courses...</div> : dashboard.courses.length === 0 ? <div className="dashboard-empty-state"><BookOpen size={34} /><strong>No enrolled courses yet</strong><p>Your library will show courses stored in Supabase after you enroll.</p><Link className="dashboard-primary-action" to="/courses">Browse courses</Link></div> : <div className="learning-course-list">
          {dashboard.courses.map((course) => <article className="learning-course-row" key={course.id}>
            <div className="course-monogram">{course.title.slice(0, 2).toUpperCase()}</div>
            <div className="learning-course-copy"><h3>{course.title}</h3><p>{course.instructor} · {course.completed_lessons} of {course.total_lessons} lessons</p><div className="progress-track"><span style={{ width: `${course.percentage}%` }} /></div></div>
            <strong className="course-progress-number">{course.percentage}%</strong>
            <Link className="icon-link" to={`/learn/${course.id}`} aria-label={`Open ${course.title}`}><ArrowRight size={20} /></Link>
          </article>)}
        </div>}
      </section>
    </section>
  );
}

export default MyLearningPage;
