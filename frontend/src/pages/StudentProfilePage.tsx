import { Award, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, RefreshCw, Save, Send, UserRound, XCircle } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getRoleHome, useAuth } from '../auth/AuthContext';
import {
  getMyInstructorRequest,
  submitInstructorRequest,
  type InstructorRequest,
  type InstructorRequestPayload
} from '../services/instructorRequestService';
import { getStudentProfile, updateStudentProfile, type StudentProfile } from '../services/profileService';

const emptyProfile: StudentProfile = {
  id: null, user_id: 0, email: '', full_name: '', certificate_name: '', date_of_birth: null,
  organization: null, country: null, bio: null, is_complete: false, certificates: []
};

const emptyApplication: InstructorRequestPayload = {
  organization: '', expertise: '', experience: '', bio: '', portfolio_url: null
};

function StudentProfilePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const shouldApplyAsInstructor = searchParams.get('apply') === 'instructor';
  const isSetupRequired = searchParams.get('setup') === 'required';
  const continuePath = searchParams.get('continue');
  const isStudent = currentUser?.role === 'student';
  const [profile, setProfile] = useState(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [application, setApplication] = useState<InstructorRequest | null>(null);
  const [applicationForm, setApplicationForm] = useState(emptyApplication);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [isRefreshingApplication, setIsRefreshingApplication] = useState(false);

  useEffect(() => {
    const profileRequest = getStudentProfile();
    const applicationRequest = isStudent
      ? getMyInstructorRequest()
      : Promise.resolve({ data: null });

    Promise.all([profileRequest, applicationRequest])
      .then(([profileResponse, applicationResponse]) => {
        if (profileResponse.data) setProfile(profileResponse.data);
        const existing = applicationResponse.data;
        setApplication(existing ?? null);
        setApplicationForm(existing ? {
          organization: existing.organization,
          expertise: existing.expertise,
          experience: existing.experience,
          bio: existing.bio,
          portfolio_url: existing.portfolio_url
        } : { ...emptyApplication, organization: profileResponse.data?.organization ?? '' });
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load profile.'))
      .finally(() => setIsLoading(false));
  }, [isStudent]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (isLoading || !shouldApplyAsInstructor || !isStudent) return;
    setNotice('Account created. Complete the Instructor application below for Admin review.');
    const timer = window.setTimeout(() => document.getElementById('instructor-application')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    return () => window.clearTimeout(timer);
  }, [isLoading, shouldApplyAsInstructor, isStudent]);

  const setField = (field: keyof StudentProfile, value: string) => setProfile((current) => ({ ...current, [field]: value || null }));
  const setApplicationField = (field: keyof InstructorRequestPayload, value: string) => setApplicationForm((current) => ({ ...current, [field]: value || null }));

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const response = await updateStudentProfile({
        certificate_name: profile.certificate_name,
        date_of_birth: profile.date_of_birth,
        organization: profile.organization,
        country: profile.country,
        bio: profile.bio
      });
      if (response.data) setProfile(response.data);
      if (isSetupRequired && currentUser) {
        if (shouldApplyAsInstructor && isStudent) {
          navigate('/profile?apply=instructor', { replace: true });
          setNotice('Profile saved. Complete the Instructor application below.');
          return;
        }
        const safeContinuePath = continuePath?.startsWith('/') ? continuePath : null;
        navigate(safeContinuePath || getRoleHome(currentUser.role), { replace: true });
        return;
      }
      setNotice('Profile and certificate information saved.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save profile.');
    } finally { setIsSaving(false); }
  }

  async function sendInstructorApplication(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsSubmittingApplication(true);
    try {
      const response = await submitInstructorRequest(applicationForm);
      if (response.data) setApplication(response.data);
      setNotice('Your instructor application was sent to the admin review queue.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to submit instructor application.');
    } finally { setIsSubmittingApplication(false); }
  }

  async function refreshApplication() {
    setError('');
    setIsRefreshingApplication(true);
    try {
      const response = await getMyInstructorRequest();
      setApplication(response.data ?? null);
      if (response.data?.status === 'approved') setNotice('Instructor access approved. Sign out and sign in again to continue.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to refresh application status.');
    } finally { setIsRefreshingApplication(false); }
  }

  if (isLoading) return <section className="learning-state">Loading account profile...</section>;

  return <section className="dashboard-page student-profile-page">
    <header className="dashboard-header">
      <div>
        <span className="eyebrow">{isSetupRequired ? 'Account setup' : 'Account profile'}</span>
        <h1>{isSetupRequired ? 'Complete your profile' : 'Personal details'}</h1>
        <p>
          {isSetupRequired
            ? 'Review your information before continuing to EduCloud.'
            : isStudent
              ? 'Keep your certificate name accurate before completing a course.'
              : 'Keep your account information current.'}
        </p>
      </div>
    </header>
    {notice && <div className="dashboard-notice dashboard-notice-success">{notice}</div>}
    {error && <div className="dashboard-notice dashboard-notice-error">{error}</div>}
    <div className={`profile-layout${isStudent ? '' : ' profile-layout-account-only'}`}>
      <form className="profile-form-card" onSubmit={saveProfile}>
        <div className="profile-card-heading"><UserRound /><div><h2>Basic information</h2><p>Your login email is read-only.</p></div></div>
        <div className="profile-fields">
          <label><span>Account name</span><input value={profile.full_name} disabled /></label>
          <label><span>Email</span><input value={profile.email} disabled /></label>
          <label className="profile-field-wide"><span>{isStudent ? 'Name printed on certificate' : 'Display name'} *</span><input required minLength={2} maxLength={120} value={profile.certificate_name} onChange={(event) => setField('certificate_name', event.target.value)} /></label>
          <label><span>Date of birth</span><input type="date" value={profile.date_of_birth || ''} onChange={(event) => setField('date_of_birth', event.target.value)} /></label>
          <label><span>Country</span><input maxLength={100} value={profile.country || ''} onChange={(event) => setField('country', event.target.value)} /></label>
          <label className="profile-field-wide"><span>School / organization</span><input maxLength={160} value={profile.organization || ''} onChange={(event) => setField('organization', event.target.value)} /></label>
          <label className="profile-field-wide"><span>About you</span><textarea rows={4} maxLength={1000} value={profile.bio || ''} onChange={(event) => setField('bio', event.target.value)} /></label>
        </div>
        <button className="dashboard-primary-action profile-save" type="submit" disabled={isSaving}><Save />{isSaving ? 'Saving...' : isSetupRequired ? 'Save and continue' : 'Save profile'}</button>
      </form>
      {isStudent && <aside className="certificate-panel">
        <div className="profile-card-heading"><Award /><div><h2>Certificates</h2><p>Issued after completing all lessons and passing the final assessment.</p></div></div>
        {profile.certificates.length === 0 ? <div className="certificate-empty"><Award /><strong>No certificates yet</strong><p>Complete a course and pass its final assessment to receive one.</p></div> : <div className="certificate-list">
          {profile.certificates.map((certificate) => <article className="certificate-card" key={certificate.id}>
            <Award /><div><span className="eyebrow">Certificate of completion</span><h3>{certificate.course_title}</h3><p>Awarded to <strong>{certificate.recipient_name}</strong></p><small><CalendarDays /> {new Date(certificate.issued_at).toLocaleDateString()}</small><Link to={`/certificates/${certificate.id}`}>View certificate</Link>{certificate.file_url && <a href={certificate.file_url} target="_blank" rel="noreferrer">Download stored PDF</a>}</div>
          </article>)}
        </div>}
      </aside>}
    </div>
    {isStudent && <section className="instructor-application-card" id="instructor-application">
      <div className="profile-card-heading"><BriefcaseBusiness /><div><h2>Become an instructor</h2><p>Apply to create and publish courses. An administrator must approve instructor access.</p></div></div>

      {application?.status === 'pending' && <div className="application-status application-status-pending">
        <Clock3 /><div><strong>Application under review</strong><p>Submitted on {new Date(application.created_at).toLocaleDateString()}. You can continue learning while an admin reviews it.</p></div>
        <button type="button" onClick={refreshApplication} disabled={isRefreshingApplication}><RefreshCw />{isRefreshingApplication ? 'Checking...' : 'Refresh status'}</button>
      </div>}

      {application?.status === 'approved' && <div className="application-status application-status-approved">
        <CheckCircle2 /><div><strong>Instructor access approved</strong><p>Sign out and sign in again so your session receives the new Instructor role.</p></div>
      </div>}

      {application?.status === 'rejected' && <div className="application-status application-status-rejected">
        <XCircle /><div><strong>Application needs changes</strong><p>{application.review_note || 'The admin did not provide a review note. Update your information and submit again.'}</p></div>
      </div>}

      {(!application || application.status === 'rejected') && <form className="instructor-application-form" onSubmit={sendInstructorApplication}>
        <div className="profile-fields">
          <label><span>School / organization *</span><input required minLength={2} maxLength={160} value={applicationForm.organization} onChange={(event) => setApplicationField('organization', event.target.value)} /></label>
          <label><span>Subject expertise *</span><input required minLength={2} maxLength={240} placeholder="e.g. Cloud Computing, AWS" value={applicationForm.expertise} onChange={(event) => setApplicationField('expertise', event.target.value)} /></label>
          <label className="profile-field-wide"><span>Teaching experience *</span><textarea required minLength={10} maxLength={2000} rows={4} placeholder="Describe your teaching or professional experience." value={applicationForm.experience} onChange={(event) => setApplicationField('experience', event.target.value)} /></label>
          <label className="profile-field-wide"><span>Why do you want to teach on EduCloud? *</span><textarea required minLength={10} maxLength={2000} rows={4} value={applicationForm.bio} onChange={(event) => setApplicationField('bio', event.target.value)} /></label>
          <label className="profile-field-wide"><span>Portfolio or professional profile</span><input type="url" maxLength={500} placeholder="https://..." value={applicationForm.portfolio_url || ''} onChange={(event) => setApplicationField('portfolio_url', event.target.value)} /></label>
        </div>
        <button className="dashboard-primary-action" type="submit" disabled={isSubmittingApplication}><Send />{isSubmittingApplication ? 'Submitting...' : application ? 'Resubmit application' : 'Submit application'}</button>
      </form>}
    </section>}
  </section>;
}

export default StudentProfilePage;
