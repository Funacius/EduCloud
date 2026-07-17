import { BookOpen, CheckCircle2, GraduationCap, ShieldCheck, UserRoundCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getAdminDashboard, type AdminDashboard } from '../services/adminService';

const emptyDashboard: AdminDashboard = { total_users: 0, students: 0, instructors: 0, admins: 0, published_courses: 0, draft_courses: 0, total_lessons: 0, total_enrollments: 0, recent_users: [] };

function AdminDashboardPage() {
  const { currentUser, token } = useAuth();
  const [data, setData] = useState(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    getAdminDashboard(token)
      .then((response) => active && setData(response.data ?? emptyDashboard))
      .catch((caught) => active && setError(caught instanceof Error ? caught.message : 'Unable to load platform data.'))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [token]);

  const metric = (value: number) => isLoading ? '—' : value;

  return (
    <section className="dashboard-page admin-dashboard">
      <header className="dashboard-header">
        <div><span className="eyebrow">Administration</span><h1>Platform overview</h1><p>Live user and course information stored in EduCloud Supabase.</p></div>
        <div className="admin-identity"><ShieldCheck size={20} /><span><strong>{currentUser?.fullName}</strong><small>Platform administrator</small></span></div>
      </header>

      {error && <p className="form-error">{error}</p>}
      <div className="metric-grid">
        <article className="metric-card"><span className="metric-icon metric-icon-blue"><Users /></span><div><strong>{metric(data.total_users)}</strong><span>Total users</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon-green"><GraduationCap /></span><div><strong>{metric(data.students)}</strong><span>Students</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon-amber"><UserRoundCheck /></span><div><strong>{metric(data.instructors)}</strong><span>Instructors</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon-coral"><BookOpen /></span><div><strong>{metric(data.published_courses)}</strong><span>Published courses</span></div></article>
      </div>

      <div className="admin-content-grid">
        <section className="dashboard-section admin-users-section">
          <div className="section-heading"><div><span className="eyebrow">Access control</span><h2>Recent users</h2></div><span className="section-count">Latest {data.recent_users.length}</span></div>
          <div className="dashboard-table-shell">
            <table className="dashboard-table">
              <thead><tr><th>User</th><th>Role</th><th>Database ID</th></tr></thead>
              <tbody>
                {data.recent_users.map((user) => <tr key={user.id}>
                  <td><strong>{user.full_name}</strong><small>{user.email}</small></td>
                  <td><span className={`role-pill role-${user.role}`}>{user.role[0].toUpperCase() + user.role.slice(1)}</span></td>
                  <td>#{user.id}</td>
                </tr>)}
              </tbody>
            </table>
            {!isLoading && data.recent_users.length === 0 && <div className="dashboard-empty-state"><Users /><strong>No users found</strong><p>The users table in Supabase is empty.</p></div>}
          </div>
        </section>

        <aside className="review-queue">
          <div className="section-heading"><div><span className="eyebrow">Database summary</span><h2>Platform content</h2></div></div>
          <div className="review-item"><span className="review-marker review-marker-amber" /><div><strong>{data.draft_courses} draft courses</strong><p>Courses currently stored with draft status</p></div></div>
          <div className="review-item"><span className="review-marker review-marker-blue" /><div><strong>{data.total_lessons} total lessons</strong><p>Lessons stored across all courses</p></div></div>
          <div className="review-item"><span className="review-marker review-marker-blue" /><div><strong>{data.total_enrollments} enrollments</strong><p>Student-course relationships in Supabase</p></div></div>
          <div className="system-status"><CheckCircle2 size={18} /><span><strong>Supabase connected</strong><small>Dashboard query completed successfully</small></span></div>
        </aside>
      </div>
    </section>
  );
}

export default AdminDashboardPage;
