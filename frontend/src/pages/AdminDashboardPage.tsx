import {
  Activity,
  BookOpen,
  CheckCircle2,
  MoreHorizontal,
  ShieldCheck,
  UserCog,
  Users
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const recentUsers = [
  { name: 'Alex Student', email: 'student@educloud.local', role: 'Student', status: 'Active' },
  { name: 'Morgan Instructor', email: 'instructor@educloud.local', role: 'Instructor', status: 'Active' },
  { name: 'Jamie Nguyen', email: 'jamie@example.com', role: 'Student', status: 'Active' },
  { name: 'Casey Tran', email: 'casey@example.com', role: 'Instructor', status: 'Pending' }
];

function AdminDashboardPage() {
  const { currentUser } = useAuth();

  return (
    <section className="dashboard-page admin-dashboard">
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">Administration</span>
          <h1>Platform overview</h1>
          <p>Manage access, review content, and monitor EduCloud operations.</p>
        </div>
        <div className="admin-identity">
          <ShieldCheck size={20} />
          <span><strong>{currentUser?.fullName}</strong><small>Platform administrator</small></span>
        </div>
      </header>

      <div className="metric-grid">
        <article className="metric-card">
          <span className="metric-icon metric-icon-blue"><Users /></span>
          <div><strong>346</strong><span>Total users</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon metric-icon-green"><BookOpen /></span>
          <div><strong>18</strong><span>Published courses</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon metric-icon-amber"><UserCog /></span>
          <div><strong>2</strong><span>Role requests</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon metric-icon-coral"><Activity /></span>
          <div><strong>99.9%</strong><span>API availability</span></div>
        </article>
      </div>

      <div className="admin-content-grid">
        <section className="dashboard-section admin-users-section">
          <div className="section-heading">
            <div><span className="eyebrow">Access control</span><h2>Recent users</h2></div>
            <button className="text-button" type="button">View all users</button>
          </div>
          <div className="dashboard-table-shell">
            <table className="dashboard-table">
              <thead><tr><th>User</th><th>Role</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.email}>
                    <td><strong>{user.name}</strong><small>{user.email}</small></td>
                    <td><span className={`role-pill role-${user.role.toLowerCase()}`}>{user.role}</span></td>
                    <td><span className={`status-pill status-${user.status.toLowerCase()}`}>{user.status}</span></td>
                    <td className="row-actions"><button type="button" title="User actions" aria-label={`Actions for ${user.name}`}><MoreHorizontal size={18} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="review-queue">
          <div className="section-heading">
            <div><span className="eyebrow">Review queue</span><h2>Needs attention</h2></div>
            <span className="section-count">3 items</span>
          </div>
          <div className="review-item">
            <span className="review-marker review-marker-amber" />
            <div><strong>2 instructor requests</strong><p>Identity and teaching access review</p></div>
          </div>
          <div className="review-item">
            <span className="review-marker review-marker-blue" />
            <div><strong>1 course awaiting review</strong><p>Serverless APIs with Lambda</p></div>
          </div>
          <div className="system-status">
            <CheckCircle2 size={18} />
            <span><strong>All systems operational</strong><small>Last checked just now</small></span>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default AdminDashboardPage;
