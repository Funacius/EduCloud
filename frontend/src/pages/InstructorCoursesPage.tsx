import {
  BookOpen,
  CheckCircle2,
  Clock3,
  EyeOff,
  Pencil,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getInstructorCourses } from '../services/courseService';
import type { CourseRecord } from '../types/course';
import logoUrl from '../../image/logo.png';

function formatPrice(price: number) {
  if (price === 0) return 'Free';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function formatUpdatedDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));
}

function formatStatus(status: CourseRecord['status']) {
  if (status === 'archived') return 'Hidden';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function InstructorCoursesPage() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    (location.state as { successMessage?: string } | null)?.successMessage ?? ''
  );

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await getInstructorCourses();
      setCourses(response.data ?? []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load your courses.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (!successMessage) return;

    if (location.state) {
      navigate(location.pathname, { replace: true, state: null });
    }
    const timer = window.setTimeout(() => setSuccessMessage(''), 3800);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.state, navigate, successMessage]);

  const counts = useMemo(() => ({
    published: courses.filter((course) => course.status === 'published').length,
    draft: courses.filter((course) => course.status === 'draft').length,
    hidden: courses.filter((course) => ['hidden', 'archived'].includes(course.status)).length
  }), [courses]);

  return (
    <section className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Instructor workspace</span>
          <h1>Your courses</h1>
          <p>Manage course content, lessons, publishing, and student engagement.</p>
        </div>
        <Link className="dashboard-primary-action" to="/instructor/courses/new">
          <Plus size={18} />
          Create course
        </Link>
      </header>

      <div className="workspace-note">
        <span className="profile-avatar">{currentUser?.fullName.slice(0, 2).toUpperCase()}</span>
        <p><strong>{currentUser?.fullName}</strong> - Instructor account</p>
      </div>

      {successMessage && (
        <div className="dashboard-notice dashboard-notice-success" role="status">
          {successMessage}
        </div>
      )}

      <div className="metric-grid">
        <article className="metric-card">
          <span className="metric-icon metric-icon-blue"><BookOpen /></span>
          <div><strong>{courses.length}</strong><span>Total courses</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon metric-icon-green"><CheckCircle2 /></span>
          <div><strong>{counts.published}</strong><span>Published</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon metric-icon-amber"><Clock3 /></span>
          <div><strong>{counts.draft}</strong><span>Draft</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon metric-icon-coral"><EyeOff /></span>
          <div><strong>{counts.hidden}</strong><span>Hidden</span></div>
        </article>
      </div>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Course management</span>
            <h2>All courses</h2>
          </div>
          <button
            className="dashboard-icon-action"
            type="button"
            title="Refresh courses"
            aria-label="Refresh courses"
            onClick={() => void loadCourses()}
            disabled={isLoading}
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {loadError && (
          <div className="dashboard-notice dashboard-notice-error" role="alert">
            <span>{loadError}</span>
            <button type="button" onClick={() => void loadCourses()}>Try again</button>
          </div>
        )}

        <div className="dashboard-table-shell">
          <table className="dashboard-table">
            <thead>
              <tr><th>Course</th><th>Status</th><th>Price</th><th>Updated</th><th><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div className="course-table-course">
                      <img
                        src={course.thumbnail_url || logoUrl}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.src = logoUrl;
                        }}
                      />
                      <span>
                        <strong>{course.title}</strong>
                        <small>{course.description || 'No description yet'}</small>
                      </span>
                    </div>
                  </td>
                  <td><span className={`status-pill status-${course.status === 'archived' ? 'hidden' : course.status}`}>{formatStatus(course.status)}</span></td>
                  <td>{formatPrice(Number(course.price))}</td>
                  <td>{formatUpdatedDate(course.updated_at)}</td>
                  <td>
                    <Link className="course-edit-action" to={`/instructor/courses/${course.id}/edit`}>
                      <Pencil size={16} />
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {isLoading && <div className="dashboard-empty-state">Loading courses...</div>}
          {!isLoading && !loadError && courses.length === 0 && (
            <div className="dashboard-empty-state">
              <BookOpen size={26} />
              <strong>No courses yet</strong>
              <p>Create your first course to start adding lessons and learning materials.</p>
              <Link className="dashboard-primary-action" to="/instructor/courses/new">
                <Plus size={18} />
                Create course
              </Link>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

export default InstructorCoursesPage;
