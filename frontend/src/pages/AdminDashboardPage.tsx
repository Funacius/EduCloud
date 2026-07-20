import { BookOpen, Check, ExternalLink, EyeOff, Globe2, GraduationCap, ShieldCheck, UserRoundCheck, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getAdminCourses, getAdminDashboard, type AdminCourseOversight, type AdminDashboard } from '../services/adminService';
import { getInstructorRequests, reviewInstructorRequest, type InstructorRequest } from '../services/instructorRequestService';
import { updateCourse } from '../services/courseService';

const emptyDashboard: AdminDashboard = { total_users: 0, students: 0, instructors: 0, admins: 0, published_courses: 0, draft_courses: 0, total_lessons: 0, total_enrollments: 0, pending_instructor_requests: 0, recent_users: [] };

function AdminDashboardPage() {
  const { currentUser, token } = useAuth();
  const [data, setData] = useState(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [requests, setRequests] = useState<InstructorRequest[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);
  const [courses, setCourses] = useState<AdminCourseOversight[]>([]);
  const [processingCourseId, setProcessingCourseId] = useState<number | null>(null);
  const [courseActionError, setCourseActionError] = useState<{ courseId: number; message: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([getAdminDashboard(token), getInstructorRequests(), getAdminCourses()])
      .then(([dashboardResponse, requestResponse, courseResponse]) => {
        if (!active) return;
        setData(dashboardResponse.data ?? emptyDashboard);
        setRequests(requestResponse.data ?? []);
        setCourses(courseResponse.data ?? []);
      })
      .catch((caught) => active && setError(caught instanceof Error ? caught.message : 'Unable to load platform data.'))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [token]);

  const metric = (value: number) => isLoading ? '—' : value;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function handleReview(request: InstructorRequest, decision: 'approve' | 'reject') {
    const note = reviewNotes[request.id]?.trim() || '';
    if (decision === 'reject' && !note) {
      setError('Add a review note before rejecting an instructor application.');
      return;
    }
    setError('');
    setProcessingRequestId(request.id);
    try {
      await reviewInstructorRequest(request.id, decision, note);
      setRequests((current) => current.filter((item) => item.id !== request.id));
      setData((current) => ({
        ...current,
        students: decision === 'approve' ? Math.max(current.students - 1, 0) : current.students,
        instructors: decision === 'approve' ? current.instructors + 1 : current.instructors,
        pending_instructor_requests: Math.max(current.pending_instructor_requests - 1, 0),
        recent_users: decision === 'approve'
          ? current.recent_users.map((user) => user.id === request.user_id ? { ...user, role: 'instructor' } : user)
          : current.recent_users
      }));
      setNotice(decision === 'approve' ? `${request.applicant_name} is now an instructor.` : `Application from ${request.applicant_name} was rejected.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to review instructor application.');
    } finally { setProcessingRequestId(null); }
  }

  async function changeCourseVisibility(course: AdminCourseOversight, nextStatus: 'published' | 'hidden') {
    if (nextStatus === 'published' && !course.can_publish) {
      setCourseActionError({ courseId: course.id, message: course.publish_blockers.join(' ') });
      return;
    }
    setProcessingCourseId(course.id);
    setError('');
    setCourseActionError(null);
    try {
      await updateCourse(String(course.id), { status: nextStatus });
      setCourses((current) => current.map((item) => item.id === course.id ? { ...item, status: nextStatus } : item));
      setData((current) => ({ ...current, published_courses: Math.max(0, current.published_courses + (nextStatus === 'published' ? 1 : course.status === 'published' ? -1 : 0)) }));
      setNotice(`'${course.title}' is now ${nextStatus}.`);
    } catch (caught) {
      setCourseActionError({ courseId: course.id, message: caught instanceof Error ? caught.message : 'Unable to update course visibility.' });
    } finally { setProcessingCourseId(null); }
  }

  return (
    <section className="dashboard-page admin-dashboard">
      <header className="dashboard-header">
        <div><span className="eyebrow">Administration</span><h1>Platform overview</h1><p>Live user and course information stored in EduCloud Supabase.</p></div>
        <div className="admin-identity"><ShieldCheck size={20} /><span><strong>{currentUser?.fullName}</strong><small>Platform administrator</small></span></div>
      </header>

      {error && <p className="form-error">{error}</p>}
      {notice && <div className="dashboard-notice dashboard-notice-success">{notice}</div>}
      <div className="metric-grid">
        <article className="metric-card"><span className="metric-icon metric-icon-blue"><Users /></span><div><strong>{metric(data.total_users)}</strong><span>Total users</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon-green"><GraduationCap /></span><div><strong>{metric(data.students)}</strong><span>Students</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon-amber"><UserRoundCheck /></span><div><strong>{metric(data.instructors)}</strong><span>Instructors</span></div></article>
        <article className="metric-card"><span className="metric-icon metric-icon-coral"><BookOpen /></span><div><strong>{metric(data.published_courses)}</strong><span>Published courses</span></div></article>
      </div>

      <section className="admin-request-section">
        <div className="section-heading"><div><span className="eyebrow">Instructor access</span><h2>Application review queue</h2></div><span className="section-count">{data.pending_instructor_requests} pending</span></div>
        {requests.length === 0 && !isLoading ? <div className="admin-request-empty"><UserRoundCheck /><strong>No pending applications</strong><p>New instructor applications will appear here.</p></div> : <div className="admin-request-list">
          {requests.map((request) => <article className="admin-request-card" key={request.id}>
            <div className="admin-request-header">
              <div><strong>{request.applicant_name}</strong><a href={`mailto:${request.applicant_email}`}>{request.applicant_email}</a></div>
              <span>Submitted {new Date(request.created_at).toLocaleDateString()}</span>
            </div>
            <dl><div><dt>Organization</dt><dd>{request.organization}</dd></div><div><dt>Expertise</dt><dd>{request.expertise}</dd></div></dl>
            <div className="admin-request-copy"><div><strong>Experience</strong><p>{request.experience}</p></div><div><strong>Teaching statement</strong><p>{request.bio}</p></div></div>
            {request.portfolio_url && <a className="admin-request-portfolio" href={request.portfolio_url} target="_blank" rel="noreferrer"><ExternalLink /> Open portfolio</a>}
            <label className="admin-review-note"><span>Review note (required when rejecting)</span><textarea rows={2} maxLength={1000} value={reviewNotes[request.id] || ''} onChange={(event) => setReviewNotes((current) => ({ ...current, [request.id]: event.target.value }))} /></label>
            <div className="admin-request-actions">
              <button className="admin-approve-action" type="button" disabled={processingRequestId === request.id} onClick={() => handleReview(request, 'approve')}><Check /> Approve</button>
              <button className="admin-reject-action" type="button" disabled={processingRequestId === request.id} onClick={() => handleReview(request, 'reject')}><X /> Reject</button>
            </div>
          </article>)}
        </div>}
      </section>

      <section className="admin-request-section admin-course-oversight">
        <div className="section-heading"><div><span className="eyebrow">Content governance</span><h2>Course oversight</h2></div><span className="section-count">{courses.length} courses</span></div>
        <div className="dashboard-table-shell">
          <table className="dashboard-table">
            <thead><tr><th>Course</th><th>Instructor</th><th>Status</th><th>Students</th><th>Certificates</th><th>Visibility</th></tr></thead>
            <tbody>{courses.map((course) => {
              const isProcessing = processingCourseId === course.id;
              const blocker = course.status !== 'published' && !course.can_publish ? course.publish_blockers.join(' ') : '';
              const inlineError = courseActionError?.courseId === course.id ? courseActionError.message : blocker;
              return <tr key={course.id}>
                <td><strong>{course.title}</strong><small>Updated {new Date(course.updated_at).toLocaleDateString()}</small></td>
                <td>{course.instructor_name}</td>
                <td><span className={`status-pill status-${course.status === 'archived' ? 'hidden' : course.status}`}>{course.status}</span></td>
                <td>{course.enrollments}</td>
                <td>{course.certificates}</td>
                <td>
                  <div className="admin-course-action">
                    {course.status === 'published'
                      ? <button className="admin-course-visibility" type="button" disabled={isProcessing} onClick={() => void changeCourseVisibility(course, 'hidden')}><EyeOff /> {isProcessing ? 'Updating...' : 'Hide'}</button>
                      : <button className="admin-course-visibility" type="button" disabled={isProcessing} onClick={() => void changeCourseVisibility(course, 'published')}><Globe2 /> {isProcessing ? 'Publishing...' : 'Publish'}</button>}
                    {inlineError && <small className="admin-course-inline-error">{inlineError}</small>}
                  </div>
                </td>
              </tr>;
            })}</tbody>
          </table>
          {!isLoading && courses.length === 0 && <div className="dashboard-empty-state"><BookOpen /><strong>No courses found</strong></div>}
        </div>
      </section>

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
        </aside>
      </div>
    </section>
  );
}

export default AdminDashboardPage;
