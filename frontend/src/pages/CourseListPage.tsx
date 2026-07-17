import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowRight, BookOpenCheck, ChartNoAxesCombined, CirclePlay } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { useAuth } from '../auth/AuthContext';
import { loadCourseCatalog } from '../data/courseCatalog';
import heroImageUrl from '../../image/hero-cloud-learning.png';

function CourseListPage() {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState<Awaited<ReturnType<typeof loadCourseCatalog>>>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isActive = true;
    loadCourseCatalog()
      .then((catalog) => {
        if (isActive) setCourses(catalog);
      })
      .catch((error) => {
        if (isActive) setLoadError(error instanceof Error ? error.message : 'Unable to load courses.');
      });
    return () => {
      isActive = false;
    };
  }, []);

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
        <img className="hero-background" src={heroImageUrl} alt="" aria-hidden="true" />
        <div className="hero-inner">
          <span className="hero-eyebrow">Cloud learning, built for progress</span>
          <h1>EduCloud Lite</h1>
          <p>
            Build practical cloud skills through focused courses, structured lessons, and a clear path
            from first concept to confident implementation.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#available-courses">
              Browse Courses
              <ArrowRight size={18} />
            </a>
            <Link className="secondary-action" to={roleAction.to}>{roleAction.label}</Link>
          </div>
        </div>
      </section>

      <section className="features" aria-label="Platform highlights">
        <div className="feature">
          <span className="feature-icon feature-icon-blue"><BookOpenCheck /></span>
          <div>
            <h2>Structured courses</h2>
            <p>Follow focused learning paths designed around practical cloud skills.</p>
          </div>
        </div>
        <div className="feature">
          <span className="feature-icon feature-icon-coral"><CirclePlay /></span>
          <div>
            <h2>Learn by doing</h2>
            <p>Work through lessons, videos, and materials at your own pace.</p>
          </div>
        </div>
        <div className="feature">
          <span className="feature-icon feature-icon-green"><ChartNoAxesCombined /></span>
          <div>
            <h2>Visible progress</h2>
            <p>See what you have completed and keep your next milestone in view.</p>
          </div>
        </div>
      </section>

      <section className="courses-section" id="available-courses">
        <div className="courses-heading">
          <div>
            <span className="courses-eyebrow">Course catalog</span>
            <h2>Available courses</h2>
            <p>Explore cloud topics and choose the next skill you want to build.</p>
          </div>
          <span className="course-count">{courses.length} courses</span>
        </div>
        <div className="course-list">
          {loadError && <div className="dashboard-notice dashboard-notice-error">{loadError}</div>}
          {!loadError && courses.length === 0 && <div className="dashboard-empty-state"><BookOpenCheck /><strong>No published courses yet</strong><p>Published courses from Supabase will appear here.</p></div>}
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>
    </>
  );
}

export default CourseListPage;
