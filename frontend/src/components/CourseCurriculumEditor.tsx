import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  FileText,
  FileVideo,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
  X
} from 'lucide-react';
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  createLesson,
  deleteLesson,
  getLessons,
  updateLesson
} from '../services/lessonService';
import { uploadLessonMaterial, uploadVideo } from '../services/uploadService';
import type { LessonPayload, LessonRecord } from '../types/course';

type CourseCurriculumEditorProps = {
  courseId: string;
};

type LessonDraft = {
  title: string;
  content: string;
  video_url: string;
  material_url: string;
  order_index: number;
};

type UploadKind = 'video' | 'material';

const emptyLesson = (orderIndex: number): LessonDraft => ({
  title: '',
  content: '',
  video_url: '',
  material_url: '',
  order_index: orderIndex
});

function attachmentName(url: string, fallback: string) {
  if (!url) return fallback;
  try {
    return decodeURIComponent(url.split('/').pop() || fallback);
  } catch {
    return fallback;
  }
}

function CourseCurriculumEditor({ courseId }: CourseCurriculumEditorProps) {
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [draft, setDraft] = useState<LessonDraft>(emptyLesson(0));
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState<UploadKind | null>(null);
  const [busyLessonId, setBusyLessonId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadLessons = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getLessons(courseId);
      setLessons(response.data ?? []);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load course lessons.');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void loadLessons();
  }, [loadLessons]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const startAdding = () => {
    setDraft(emptyLesson(lessons.length));
    setEditingLessonId(null);
    setEditorOpen(true);
    setError('');
  };

  const startEditing = (lesson: LessonRecord) => {
    setDraft({
      title: lesson.title,
      content: lesson.content ?? '',
      video_url: lesson.video_url ?? '',
      material_url: lesson.material_url ?? '',
      order_index: lesson.order_index
    });
    setEditingLessonId(lesson.id);
    setEditorOpen(true);
    setError('');
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingLessonId(null);
    setDraft(emptyLesson(lessons.length));
    setError('');
  };

  const handleUpload = async (kind: UploadKind, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(kind);
    setError('');
    try {
      const response = kind === 'video'
        ? await uploadVideo(file, courseId)
        : await uploadLessonMaterial(file, courseId);
      if (!response.data) throw new Error('The upload API did not return a file URL.');
      setDraft((current) => ({
        ...current,
        [kind === 'video' ? 'video_url' : 'material_url']: response.data?.url ?? ''
      }));
      setNotice(`${response.data.filename} uploaded successfully.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to upload this file.');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!draft.title.trim()) {
      setError('Lesson title is required.');
      return;
    }

    const payload: LessonPayload = {
      title: draft.title.trim(),
      content: draft.content.trim() || undefined,
      video_url: draft.video_url || undefined,
      material_url: draft.material_url || undefined,
      order_index: draft.order_index
    };

    setIsSaving(true);
    try {
      if (editingLessonId) {
        await updateLesson(editingLessonId, payload);
        setNotice('Lesson updated successfully.');
      } else {
        await createLesson(courseId, payload);
        setNotice('Lesson added successfully.');
      }
      closeEditor();
      await loadLessons();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to save this lesson.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (lesson: LessonRecord) => {
    if (!window.confirm(`Delete lesson "${lesson.title}"?`)) return;
    setBusyLessonId(lesson.id);
    setError('');
    try {
      await deleteLesson(lesson.id);
      setNotice('Lesson deleted.');
      await loadLessons();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to delete this lesson.');
    } finally {
      setBusyLessonId(null);
    }
  };

  const moveLesson = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;
    const lesson = lessons[index];
    const target = lessons[targetIndex];
    setBusyLessonId(lesson.id);
    setError('');
    try {
      await Promise.all([
        updateLesson(lesson.id, { order_index: target.order_index }),
        updateLesson(target.id, { order_index: lesson.order_index })
      ]);
      await loadLessons();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to reorder lessons.');
    } finally {
      setBusyLessonId(null);
    }
  };

  return (
    <section className="curriculum-editor">
      <div className="curriculum-heading">
        <div className="curriculum-title">
          <span className="curriculum-title-icon"><BookOpen /></span>
          <div>
            <span className="eyebrow">Course curriculum</span>
            <h2>Lessons and resources</h2>
            <p>Build the course lesson by lesson, then attach its video and supporting material.</p>
          </div>
        </div>
        {!editorOpen && (
          <button className="dashboard-primary-action" type="button" onClick={startAdding}>
            <Plus size={18} />
            Add lesson
          </button>
        )}
      </div>

      {notice && <div className="dashboard-notice dashboard-notice-success" role="status">{notice}</div>}
      {error && <p className="curriculum-error" role="alert">{error}</p>}

      {editorOpen && (
        <form className="lesson-editor-form" onSubmit={handleSubmit} noValidate>
          <div className="lesson-editor-header">
            <div>
              <span className="eyebrow">{editingLessonId ? 'Edit lesson' : 'New lesson'}</span>
              <h3>{editingLessonId ? 'Update lesson content' : 'Add to curriculum'}</h3>
            </div>
            <button type="button" title="Close lesson editor" aria-label="Close lesson editor" onClick={closeEditor}>
              <X size={19} />
            </button>
          </div>

          <div className="lesson-editor-fields">
            <label className="course-editor-field">
              <span>Lesson title *</span>
              <input
                autoFocus
                maxLength={200}
                placeholder="e.g. Introduction to Amazon S3"
                value={draft.title}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, title: event.target.value }));
                  setError('');
                }}
              />
            </label>

            <label className="course-editor-field">
              <span>Lesson notes</span>
              <textarea
                rows={5}
                placeholder="Add a lesson summary, instructions, or key concepts."
                value={draft.content}
                onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
              />
            </label>

            <div className="lesson-upload-grid">
              <div className="lesson-upload-field">
                <span className="lesson-upload-label"><FileVideo size={17} /> Lesson video</span>
                <label className="lesson-upload-zone">
                  <UploadCloud size={22} />
                  <strong>{uploading === 'video' ? 'Uploading video...' : 'Choose video'}</strong>
                  <small>MP4, WebM or MOV, up to 500 MB</small>
                  <input
                    className="sr-only"
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    disabled={Boolean(uploading)}
                    onChange={(event) => void handleUpload('video', event)}
                  />
                </label>
                {draft.video_url && (
                  <div className="lesson-attachment">
                    <FileVideo size={17} />
                    <a href={draft.video_url} target="_blank" rel="noreferrer">
                      {attachmentName(draft.video_url, 'Lesson video')}
                    </a>
                    <button type="button" title="Remove video" aria-label="Remove video" onClick={() => setDraft((current) => ({ ...current, video_url: '' }))}>
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="lesson-upload-field">
                <span className="lesson-upload-label"><FileText size={17} /> Supporting file</span>
                <label className="lesson-upload-zone">
                  <UploadCloud size={22} />
                  <strong>{uploading === 'material' ? 'Uploading file...' : 'Choose document'}</strong>
                  <small>PDF, Office, TXT or ZIP, up to 50 MB</small>
                  <input
                    className="sr-only"
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                    disabled={Boolean(uploading)}
                    onChange={(event) => void handleUpload('material', event)}
                  />
                </label>
                {draft.material_url && (
                  <div className="lesson-attachment">
                    <FileText size={17} />
                    <a href={draft.material_url} target="_blank" rel="noreferrer">
                      {attachmentName(draft.material_url, 'Lesson material')}
                    </a>
                    <button type="button" title="Remove material" aria-label="Remove material" onClick={() => setDraft((current) => ({ ...current, material_url: '' }))}>
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lesson-editor-actions">
            <button className="course-editor-cancel" type="button" onClick={closeEditor}>Cancel</button>
            <button className="dashboard-primary-action" type="submit" disabled={isSaving || Boolean(uploading)}>
              {isSaving ? 'Saving...' : editingLessonId ? 'Save lesson' : 'Add lesson'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="curriculum-empty">Loading lessons...</div>
      ) : lessons.length === 0 ? (
        <div className="curriculum-empty">
          <BookOpen size={26} />
          <strong>No lessons yet</strong>
          <p>Add the first lesson, then attach a video or downloadable resource.</p>
        </div>
      ) : (
        <div className="lesson-list">
          {lessons.map((lesson, index) => (
            <article className="lesson-card" key={lesson.id}>
              <span className="lesson-number">{index + 1}</span>
              <div className="lesson-card-content">
                <strong>{lesson.title}</strong>
                <p>{lesson.content || 'No lesson notes yet.'}</p>
                <div className="lesson-assets">
                  {lesson.video_url && <span><FileVideo size={15} /> Video</span>}
                  {lesson.material_url && <span><FileText size={15} /> Material</span>}
                  {!lesson.video_url && !lesson.material_url && <span>No files attached</span>}
                </div>
              </div>
              <div className="lesson-card-actions">
                <button type="button" title="Move lesson up" aria-label={`Move ${lesson.title} up`} disabled={index === 0 || busyLessonId === lesson.id} onClick={() => void moveLesson(index, -1)}>
                  <ArrowUp size={17} />
                </button>
                <button type="button" title="Move lesson down" aria-label={`Move ${lesson.title} down`} disabled={index === lessons.length - 1 || busyLessonId === lesson.id} onClick={() => void moveLesson(index, 1)}>
                  <ArrowDown size={17} />
                </button>
                <button type="button" title="Edit lesson" aria-label={`Edit ${lesson.title}`} onClick={() => startEditing(lesson)}>
                  <Pencil size={17} />
                </button>
                <button className="lesson-delete-action" type="button" title="Delete lesson" aria-label={`Delete ${lesson.title}`} disabled={busyLessonId === lesson.id} onClick={() => void handleDelete(lesson)}>
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default CourseCurriculumEditor;
