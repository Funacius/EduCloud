import {
  BookOpen,
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  Pencil,
  Plus,
  Users
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const instructorCourses = [
  { title: 'Cloud Fundamentals', status: 'Published', students: 128, lessons: 4, updated: 'Today' },
  { title: 'AWS S3 File Storage', status: 'Published', students: 84, lessons: 5, updated: '2 days ago' },
  { title: 'Serverless APIs with Lambda', status: 'Draft', students: 0, lessons: 3, updated: 'Yesterday' }
];

function InstructorCoursesPage() {
  const { currentUser } = useAuth();

  return (
    <section className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Instructor workspace</span>
          <h1>Your courses</h1>
          <p>Manage course content, lessons, publishing, and student engagement.</p>
        </div>
        <button className="dashboard-primary-action" type="button">
          <Plus size={18} />
          Create course
        </button>
      </header>

      <div className="workspace-note">
        <span className="profile-avatar">{currentUser?.fullName.slice(0, 2).toUpperCase()}</span>
        <p><strong>{currentUser?.fullName}</strong> · Instructor account</p>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <span className="metric-icon metric-icon-blue"><BookOpen /></span>
          <div><strong>3</strong><span>Total courses</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon metric-icon-green"><CheckCircle2 /></span>
          <div><strong>2</strong><span>Published</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon metric-icon-amber"><Clock3 /></span>
          <div><strong>1</strong><span>Draft</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon metric-icon-coral"><Users /></span>
          <div><strong>212</strong><span>Total students</span></div>
        </article>
      </div>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Course management</span>
            <h2>All courses</h2>
          </div>
          <label className="compact-filter">
            <span>Status</span>
            <select defaultValue="all">
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
        </div>

        <div className="dashboard-table-shell">
          <table className="dashboard-table">
            <thead>
              <tr><th>Course</th><th>Status</th><th>Students</th><th>Lessons</th><th>Updated</th><th><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {instructorCourses.map((course) => (
                <tr key={course.title}>
                  <td><strong>{course.title}</strong><small>Cloud learning</small></td>
                  <td><span className={`status-pill status-${course.status.toLowerCase()}`}>{course.status}</span></td>
                  <td>{course.students}</td>
                  <td>{course.lessons}</td>
                  <td>{course.updated}</td>
                  <td className="row-actions">
                    <button type="button" title="Edit course" aria-label={`Edit ${course.title}`}><Pencil size={17} /></button>
                    <button type="button" title="More actions" aria-label={`More actions for ${course.title}`}><MoreHorizontal size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export default InstructorCoursesPage;
