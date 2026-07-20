import { ArrowLeft, Award, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import logoUrl from '../../image/logo.png';
import { getStudentProfile, type Certificate } from '../services/profileService';

function CertificatePage() {
  const { certificateId = '' } = useParams();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getStudentProfile()
      .then((response) => {
        const match = response.data?.certificates.find((item) => item.id === Number(certificateId));
        if (!match) throw new Error('Certificate not found or you do not have access to it.');
        setCertificate(match);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load certificate.'))
      .finally(() => setIsLoading(false));
  }, [certificateId]);

  if (isLoading) return <section className="certificate-state">Loading certificate...</section>;
  if (!certificate) return <section className="certificate-state certificate-state-error"><Award /><strong>{error}</strong><Link to="/profile">Back to profile</Link></section>;

  const issuedDate = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(certificate.issued_at));

  return <section className="certificate-page">
    <div className="certificate-toolbar"><Link to="/profile"><ArrowLeft /> Back to profile</Link><button type="button" onClick={() => window.print()}><Printer /> Print / Save as PDF</button></div>
    <article className="educloud-certificate">
      <div className="certificate-corner certificate-corner-top" />
      <div className="certificate-corner certificate-corner-bottom" />
      <div className="certificate-inner-border">
        <header className="certificate-brand"><img src={logoUrl} alt="EduCloud Lite logo" /><span><strong>EduCloud Lite</strong><small>Cloud Learning Platform</small></span></header>
        <div className="certificate-award-mark"><Award /></div>
        <span className="certificate-kicker">Certificate of Completion</span>
        <h1>This certificate is proudly presented to</h1>
        <strong className="certificate-recipient">{certificate.recipient_name}</strong>
        <div className="certificate-name-line" />
        <p className="certificate-copy">for successfully completing the EduCloud course</p>
        <h2>{certificate.course_title}</h2>
        <p className="certificate-date">Awarded on <strong>{issuedDate}</strong></p>
        <footer className="certificate-footer">
          <div><span className="certificate-signature">EduCloud</span><i /><small>Academic Board</small></div>
          <p>Practical cloud learning, verified by progress and final assessment.</p>
          <div><strong>Verified</strong><i /><small>Course completion</small></div>
        </footer>
      </div>
    </article>
  </section>;
}

export default CertificatePage;
