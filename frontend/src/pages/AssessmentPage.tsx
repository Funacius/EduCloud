import { Award, CheckCircle2, ChevronLeft, ClipboardCheck, Clock3, RotateCcw, Send, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getStudentAssessment,
  startStudentAssessment,
  submitStudentAssessment,
  type AssessmentResult,
  type StudentAssessment
} from '../services/assessmentService';

function remainingSeconds(expiresAt: string | null) {
  return expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 0;
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function AssessmentPage() {
  const { courseId = '' } = useParams();
  const [assessment, setAssessment] = useState<StudentAssessment | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const answersRef = useRef(answers);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const autoSubmitted = useRef(false);

  useEffect(() => { answersRef.current = answers; }, [answers]);

  const loadAssessment = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getStudentAssessment(courseId);
      if (!response.data) throw new Error('The assessment response was empty.');
      setAssessment(response.data);
      setAttemptId(response.data.active_attempt_id);
      setExpiresAt(response.data.expires_at);
      setSecondsLeft(remainingSeconds(response.data.expires_at));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load the final assessment.');
    } finally { setIsLoading(false); }
  }, [courseId]);

  useEffect(() => { void loadAssessment(); }, [loadAssessment]);

  const finishAttempt = useCallback(async (automatic = false) => {
    if (!attemptId || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      const response = await submitStudentAssessment(courseId, attemptId, answersRef.current);
      if (!response.data) throw new Error('The assessment result was empty.');
      setResult(response.data);
      setAttemptId(null);
      setExpiresAt(null);
      if (automatic && response.data.score === 0) setError('Time expired. This attempt was submitted automatically.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to submit the assessment.');
    } finally { setIsSubmitting(false); }
  }, [attemptId, courseId, isSubmitting]);

  useEffect(() => {
    if (!attemptId || !expiresAt || result) return;
    const tick = () => {
      const remaining = remainingSeconds(expiresAt);
      setSecondsLeft(remaining);
      if (remaining === 0 && !autoSubmitted.current) {
        autoSubmitted.current = true;
        void finishAttempt(true);
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [attemptId, expiresAt, finishAttempt, result]);

  async function startAttempt() {
    setIsStarting(true);
    setError('');
    setResult(null);
    setAnswers({});
    autoSubmitted.current = false;
    try {
      const response = await startStudentAssessment(courseId);
      if (!response.data) throw new Error('The assessment could not be started.');
      setAttemptId(response.data.attempt_id);
      setExpiresAt(response.data.expires_at);
      setSecondsLeft(remainingSeconds(response.data.expires_at));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to start the assessment.');
    } finally { setIsStarting(false); }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void finishAttempt(false);
  }

  if (isLoading) return <section className="assessment-state">Loading final assessment...</section>;
  if (!assessment) return <section className="assessment-state assessment-state-error"><ClipboardCheck /><strong>{error || 'Assessment unavailable'}</strong><Link to={`/learn/${courseId}`}>Back to course</Link></section>;

  const attemptsRemaining = Math.max(assessment.max_attempts - assessment.attempts_used, 0);

  return <section className="assessment-page">
    <header className="assessment-hero">
      <div><Link to={`/learn/${courseId}`}><ChevronLeft /> Back to course</Link><span className="eyebrow">Final assessment</span><h1>{assessment.title}</h1><p>{assessment.course_title}</p></div>
      {attemptId && <div className={secondsLeft <= 60 ? 'assessment-timer is-warning' : 'assessment-timer'}><Clock3 /><span><small>Time remaining</small><strong>{formatTimer(secondsLeft)}</strong></span></div>}
    </header>

    <main className="assessment-main">
      {error && <div className="dashboard-notice dashboard-notice-error">{error}</div>}

      {assessment.passed && !result ? <section className="assessment-result is-passed"><Award /><span className="eyebrow">Completed</span><h2>You already passed this assessment</h2><p>Your course certificate is available in your profile.</p><Link className="dashboard-primary-action" to="/profile">View certificates</Link></section>
      : result ? <section className={result.passed ? 'assessment-result is-passed' : 'assessment-result is-failed'}>
        {result.passed ? <CheckCircle2 /> : <XCircle />}
        <span className="eyebrow">Assessment result</span><strong className="assessment-score">{result.score}%</strong>
        <h2>{result.passed ? 'Assessment passed' : 'Not passed yet'}</h2>
        <p>{result.correct_answers} of {result.total_questions} correct · Required score: {result.passing_score}%</p>
        {result.passed ? <><p>Your certificate has been issued automatically.</p><Link className="dashboard-primary-action" to="/profile"><Award /> View certificate</Link></>
        : <button className="dashboard-primary-action" type="button" onClick={() => { setResult(null); void loadAssessment(); }}><RotateCcw /> Review attempts</button>}
      </section>
      : !attemptId ? <section className="assessment-intro-card">
        <ClipboardCheck />
        <div><span className="eyebrow">Ready when you are</span><h2>{assessment.title}</h2><p>{assessment.instructions || 'Complete the assessment before the timer expires.'}</p></div>
        <dl><div><dt>Questions</dt><dd>{assessment.questions.length}</dd></div><div><dt>Time limit</dt><dd>{assessment.time_limit_minutes} min</dd></div><div><dt>Pass mark</dt><dd>{assessment.passing_score}%</dd></div><div><dt>Attempts left</dt><dd>{attemptsRemaining}</dd></div></dl>
        {!assessment.eligible && <div className="assessment-locked"><XCircle /><span><strong>Assessment locked</strong><small>Complete all {assessment.total_lessons} lessons first.</small></span></div>}
        <button className="dashboard-primary-action" type="button" disabled={!assessment.eligible || attemptsRemaining === 0 || isStarting} onClick={() => void startAttempt()}>{isStarting ? 'Starting...' : 'Start timed assessment'}</button>
      </section>
      : <form className="student-assessment-form" onSubmit={submit}>
        <div className="assessment-progress-line"><span>{Object.keys(answers).length} of {assessment.questions.length} answered</span><div><i style={{ width: `${assessment.questions.length ? Object.keys(answers).length * 100 / assessment.questions.length : 0}%` }} /></div></div>
        {assessment.questions.map((question, questionIndex) => <fieldset className="student-question-card" key={question.id}>
          <legend><span>{questionIndex + 1}</span>{question.prompt}</legend>
          <div>{question.options.map((option, optionIndex) => <label className={answers[question.id] === optionIndex ? 'is-selected' : ''} key={optionIndex}><input type="radio" name={`question-${question.id}`} checked={answers[question.id] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))} /><span>{String.fromCharCode(65 + optionIndex)}</span><strong>{option}</strong></label>)}</div>
        </fieldset>)}
        <div className="assessment-submit-bar"><span><Clock3 /> Submit before {formatTimer(secondsLeft)} reaches zero</span><button className="dashboard-primary-action" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : <><Send /> Submit assessment</>}</button></div>
      </form>}
    </main>
  </section>;
}

export default AssessmentPage;
