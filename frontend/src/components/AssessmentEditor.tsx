import { CheckCircle2, CirclePlus, ClipboardCheck, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  getInstructorAssessment,
  saveInstructorAssessment,
  type AssessmentQuestionEditor,
  type InstructorAssessment
} from '../services/assessmentService';

const emptyQuestion = (order: number): AssessmentQuestionEditor => ({
  prompt: '', options: ['', ''], correct_option_index: 0, explanation: null, order_index: order
});

const emptyAssessment = (courseId: string): InstructorAssessment => ({
  id: null,
  course_id: Number(courseId),
  title: 'Final assessment',
  instructions: 'Answer every question and submit before the timer expires.',
  time_limit_minutes: 20,
  passing_score: 70,
  max_attempts: 3,
  is_published: false,
  questions: []
});

function AssessmentEditor({ courseId }: { courseId: string }) {
  const [assessment, setAssessment] = useState<InstructorAssessment>(() => emptyAssessment(courseId));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    getInstructorAssessment(courseId)
      .then((response) => response.data && setAssessment(response.data))
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load the final assessment.'))
      .finally(() => setIsLoading(false));
  }, [courseId]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const updateQuestion = (index: number, next: AssessmentQuestionEditor) => {
    setAssessment((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) => questionIndex === index ? next : question)
    }));
  };

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (assessment.questions.some((question) => !question.prompt.trim() || question.options.some((option) => !option.trim()))) {
      setError('Every question and answer option must contain text.');
      return;
    }
    setIsSaving(true);
    try {
      const response = await saveInstructorAssessment(courseId, {
        title: assessment.title.trim(),
        instructions: assessment.instructions?.trim() || null,
        time_limit_minutes: assessment.time_limit_minutes,
        passing_score: assessment.passing_score,
        max_attempts: assessment.max_attempts,
        is_published: assessment.is_published,
        questions: assessment.questions.map((question, index) => ({ ...question, order_index: index }))
      });
      if (response.data) setAssessment(response.data);
      setNotice('Final assessment saved successfully.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save the assessment.');
    } finally { setIsSaving(false); }
  }

  if (isLoading) return <section className="assessment-editor curriculum-editor"><div className="curriculum-empty">Loading final assessment...</div></section>;

  return <section className="assessment-editor curriculum-editor">
    <div className="curriculum-heading">
      <div className="curriculum-title"><span className="curriculum-title-icon"><ClipboardCheck /></span><div><span className="eyebrow">Course completion</span><h2>Final assessment</h2><p>Students must pass this timed test before receiving a certificate.</p></div></div>
    </div>
    {notice && <div className="dashboard-notice dashboard-notice-success">{notice}</div>}
    {error && <div className="dashboard-notice dashboard-notice-error">{error}</div>}
    <form className="assessment-editor-form" onSubmit={handleSave}>
      <div className="assessment-settings-grid">
        <label className="course-editor-field assessment-title-field"><span>Assessment title</span><input required minLength={3} maxLength={200} value={assessment.title} onChange={(event) => setAssessment((current) => ({ ...current, title: event.target.value }))} /></label>
        <label className="course-editor-field"><span>Time limit (minutes)</span><input type="number" min={1} max={180} value={assessment.time_limit_minutes} onChange={(event) => setAssessment((current) => ({ ...current, time_limit_minutes: Number(event.target.value) }))} /></label>
        <label className="course-editor-field"><span>Passing score (%)</span><input type="number" min={1} max={100} value={assessment.passing_score} onChange={(event) => setAssessment((current) => ({ ...current, passing_score: Number(event.target.value) }))} /></label>
        <label className="course-editor-field"><span>Maximum attempts</span><input type="number" min={1} max={10} value={assessment.max_attempts} onChange={(event) => setAssessment((current) => ({ ...current, max_attempts: Number(event.target.value) }))} /></label>
        <label className="course-editor-field assessment-instructions-field"><span>Instructions</span><textarea rows={3} maxLength={4000} value={assessment.instructions || ''} onChange={(event) => setAssessment((current) => ({ ...current, instructions: event.target.value }))} /></label>
        <label className="assessment-publish-toggle"><input type="checkbox" checked={assessment.is_published} onChange={(event) => setAssessment((current) => ({ ...current, is_published: event.target.checked }))} /><span><strong>Publish final assessment</strong><small>Required before the course itself can be published.</small></span></label>
      </div>

      <div className="assessment-question-heading"><div><h3>Questions</h3><p>{assessment.questions.length} question(s)</p></div><button type="button" className="dashboard-primary-action" onClick={() => setAssessment((current) => ({ ...current, questions: [...current.questions, emptyQuestion(current.questions.length)] }))}><CirclePlus /> Add question</button></div>
      <div className="assessment-question-list">
        {assessment.questions.length === 0 && <div className="curriculum-empty"><ClipboardCheck /><strong>No questions yet</strong><p>Add at least one multiple-choice question before publishing.</p></div>}
        {assessment.questions.map((question, questionIndex) => <article className="assessment-question-editor" key={question.id ?? `new-${questionIndex}`}>
          <header><span>Question {questionIndex + 1}</span><button type="button" aria-label={`Remove question ${questionIndex + 1}`} onClick={() => setAssessment((current) => ({ ...current, questions: current.questions.filter((_, index) => index !== questionIndex) }))}><Trash2 /></button></header>
          <label className="course-editor-field"><span>Question *</span><textarea rows={2} required maxLength={1000} value={question.prompt} onChange={(event) => updateQuestion(questionIndex, { ...question, prompt: event.target.value })} /></label>
          <div className="assessment-options">
            {question.options.map((option, optionIndex) => <div className="assessment-option-editor" key={optionIndex}>
              <label title="Correct answer"><input type="radio" name={`correct-${questionIndex}`} checked={question.correct_option_index === optionIndex} onChange={() => updateQuestion(questionIndex, { ...question, correct_option_index: optionIndex })} /><CheckCircle2 /></label>
              <input required maxLength={500} placeholder={`Option ${optionIndex + 1}`} value={option} onChange={(event) => updateQuestion(questionIndex, { ...question, options: question.options.map((item, index) => index === optionIndex ? event.target.value : item) })} />
              <button type="button" disabled={question.options.length <= 2} aria-label={`Remove option ${optionIndex + 1}`} onClick={() => {
                const options = question.options.filter((_, index) => index !== optionIndex);
                const correct = question.correct_option_index === optionIndex ? 0 : question.correct_option_index > optionIndex ? question.correct_option_index - 1 : question.correct_option_index;
                updateQuestion(questionIndex, { ...question, options, correct_option_index: correct });
              }}><X /></button>
            </div>)}
            <button className="assessment-add-option" type="button" disabled={question.options.length >= 6} onClick={() => updateQuestion(questionIndex, { ...question, options: [...question.options, ''] })}><CirclePlus /> Add option</button>
          </div>
          <label className="course-editor-field"><span>Explanation after submission (optional)</span><textarea rows={2} maxLength={2000} value={question.explanation || ''} onChange={(event) => updateQuestion(questionIndex, { ...question, explanation: event.target.value })} /></label>
        </article>)}
      </div>
      <div className="course-editor-actions"><button className="dashboard-primary-action" type="submit" disabled={isSaving}><Save />{isSaving ? 'Saving assessment...' : 'Save assessment'}</button></div>
    </form>
  </section>;
}

export default AssessmentEditor;
