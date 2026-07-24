import { ArrowLeft, BookOpen, ClipboardCheck, Pencil, Plus, Save, Trash2, UploadCloud } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../services/apiClient';
import { createCourse, getManagedCourse, updateCourse } from '../services/courseService';
import type { CourseCreatePayload } from '../types/course';
import logoUrl from '../../image/logo.png';
import CourseCurriculumEditor from '../components/CourseCurriculumEditor';
import { importCourseThumbnail, uploadCourseThumbnail } from '../services/uploadService';
import AssessmentEditor from '../components/AssessmentEditor';
import ThumbnailCropEditor from '../components/ThumbnailCropEditor';

type CourseField = keyof CourseCreatePayload;
type CourseFieldErrors = Partial<Record<CourseField, string>>;

const initialForm: CourseCreatePayload = {
  title: '',
  description: '',
  level: 'Beginner',
  category: '',
  learning_outcomes: [''],
  requirements: [''],
  thumbnail_url: '',
  price: 0,
  status: 'draft'
};

type CourseListFieldProps = {
  label: string;
  help: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
};

function CourseListField({ label, help, placeholder, values, onChange }: CourseListFieldProps) {
  return (
    <div className="course-list-field">
      <div className="course-list-field-heading">
        <div>
          <strong>{label}</strong>
          <small>{help}</small>
        </div>
        <button
          type="button"
          className="course-list-add"
          disabled={values.length >= 20}
          onClick={() => onChange([...values, ''])}
        >
          <Plus size={16} /> Add item
        </button>
      </div>

      {values.length === 0 ? (
        <button type="button" className="course-list-empty" onClick={() => onChange([''])}>
          <Plus size={17} /> Add the first item
        </button>
      ) : (
        <div className="course-list-rows">
          {values.map((value, index) => (
            <div className="course-list-row" key={`${label}-${index}`}>
              <span>{index + 1}</span>
              <input
                maxLength={300}
                placeholder={placeholder}
                value={value}
                onChange={(event) => {
                  const nextValues = [...values];
                  nextValues[index] = event.target.value;
                  onChange(nextValues);
                }}
              />
              <button
                type="button"
                title={`Remove ${label.toLowerCase()} item ${index + 1}`}
                aria-label={`Remove ${label.toLowerCase()} item ${index + 1}`}
                onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateCoursePage() {
  const { courseId } = useParams();
  const isEditing = Boolean(courseId);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<CourseFieldErrors>({});
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [thumbnailNotice, setThumbnailNotice] = useState('');
  const [pendingThumbnailFile, setPendingThumbnailFile] = useState<File | null>(null);
  const [pendingThumbnailPreview, setPendingThumbnailPreview] = useState('');
  const [thumbnailCropSource, setThumbnailCropSource] = useState('');
  const [ownedCropSource, setOwnedCropSource] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!courseId) return;

    let isActive = true;
    const loadCourse = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getManagedCourse(courseId);
        if (!response.data) throw new Error('The course could not be found.');
        if (!isActive) return;

        const course = response.data;
        setForm({
          title: course.title,
          description: course.description ?? '',
          level: course.level,
          category: course.category,
          learning_outcomes: course.learning_outcomes.length > 0 ? course.learning_outcomes : [''],
          requirements: course.requirements.length > 0 ? course.requirements : [''],
          thumbnail_url: course.thumbnail_url ?? '',
          price: Number(course.price),
          status: course.status === 'archived' ? 'hidden' : course.status
        });
      } catch (caughtError) {
        if (isActive) {
          setError(caughtError instanceof Error ? caughtError.message : 'Unable to load the course.');
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void loadCourse();
    return () => {
      isActive = false;
    };
  }, [courseId]);

  useEffect(() => {
    if (!thumbnailNotice) return;
    const timer = window.setTimeout(() => setThumbnailNotice(''), 4500);
    return () => window.clearTimeout(timer);
  }, [thumbnailNotice]);

  useEffect(() => {
    return () => {
      if (pendingThumbnailPreview) URL.revokeObjectURL(pendingThumbnailPreview);
    };
  }, [pendingThumbnailPreview]);

  useEffect(() => {
    return () => {
      if (ownedCropSource) URL.revokeObjectURL(ownedCropSource);
    };
  }, [ownedCropSource]);

  const closeThumbnailCrop = () => {
    setThumbnailCropSource('');
    setOwnedCropSource('');
  };

  const handleThumbnailSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('The thumbnail image must be 10 MB or smaller.');
      return;
    }

    const source = URL.createObjectURL(file);
    setOwnedCropSource(source);
    setThumbnailCropSource(source);
    setError('');
    setThumbnailNotice('');
  };

  const handleCroppedThumbnail = async (file: File) => {
    closeThumbnailCrop();

    if (!courseId) {
      setPendingThumbnailFile(file);
      setPendingThumbnailPreview(URL.createObjectURL(file));
      setForm((current) => ({ ...current, thumbnail_url: '' }));
      setFieldErrors((current) => ({ ...current, thumbnail_url: undefined }));
      setThumbnailNotice('Thumbnail edited. It will be uploaded after the draft is created.');
      return;
    }

    setIsUploadingThumbnail(true);
    setError('');
    setThumbnailNotice('');
    try {
      const response = await uploadCourseThumbnail(file, courseId);
      if (!response.data) throw new Error('The upload API did not return an image URL.');
      setForm((current) => ({ ...current, thumbnail_url: response.data?.url ?? '' }));
      setThumbnailNotice('Edited thumbnail uploaded. Save changes to apply it to the course.');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to upload the thumbnail.');
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleEditThumbnail = async () => {
    const source = pendingThumbnailPreview || form.thumbnail_url || '';
    if (!source) return;

    if (source.startsWith('blob:') || !courseId) {
      setThumbnailCropSource(source);
      return;
    }

    setIsUploadingThumbnail(true);
    setError('');
    setThumbnailNotice('Preparing the image for editing...');
    try {
      const response = await importCourseThumbnail(source, courseId);
      if (!response.data?.url) {
        throw new Error('The import API did not return an image URL.');
      }
      setThumbnailCropSource(`${response.data.url}?crop=${Date.now()}`);
      setThumbnailNotice('Image imported securely. Adjust its crop and apply the thumbnail.');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to prepare the thumbnail for editing.'
      );
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const nextErrors: CourseFieldErrors = {};

    if (form.title.trim().length < 3) {
      nextErrors.title = 'Course title must contain at least 3 characters.';
    }

    if (form.category.trim().length < 2) {
      nextErrors.category = 'Category must contain at least 2 characters.';
    }

    if (form.thumbnail_url) {
      try {
        const thumbnailUrl = new URL(form.thumbnail_url);
        if (!['http:', 'https:'].includes(thumbnailUrl.protocol)) throw new Error();
      } catch {
        nextErrors.thumbnail_url = 'Thumbnail URL must be a valid web address.';
      }
    }

    if (!Number.isFinite(form.price) || form.price < 0) {
      nextErrors.price = 'Price must be zero or a positive number.';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CourseCreatePayload = {
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        category: form.category.trim(),
        learning_outcomes: form.learning_outcomes.map((item) => item.trim()).filter(Boolean),
        requirements: form.requirements.map((item) => item.trim()).filter(Boolean),
        thumbnail_url: form.thumbnail_url?.trim() || undefined,
        status: courseId ? form.status : 'draft'
      };
      const response = courseId
        ? await updateCourse(courseId, payload)
        : await createCourse(payload);

      if (!response.data) {
        throw new Error('The API did not return the created course.');
      }

      if (!courseId) {
        const createdCourseId = String(response.data.id);
        let thumbnailWarning = '';

        if (pendingThumbnailFile) {
          try {
            const uploadResponse = await uploadCourseThumbnail(pendingThumbnailFile, createdCourseId);
            if (!uploadResponse.data?.url) {
              throw new Error('The upload API did not return an image URL.');
            }
            await updateCourse(createdCourseId, { thumbnail_url: uploadResponse.data.url });
          } catch (uploadError) {
            thumbnailWarning = uploadError instanceof Error
              ? ` The draft was created, but its thumbnail could not be uploaded: ${uploadError.message}`
              : ' The draft was created, but its thumbnail could not be uploaded.';
          }
        }

        navigate(`/instructor/courses/${createdCourseId}/edit`, {
          replace: true,
          state: {
            successMessage: `'${response.data.title}' was created as a draft. Add lessons and a final assessment below.${thumbnailWarning}`
          }
        });
        return;
      }

      navigate('/instructor/courses', {
        replace: true,
        state: {
          successMessage: `'${response.data.title}' was ${isEditing ? 'updated' : 'created'} successfully.`
        }
      });
    } catch (caughtError) {
      if (caughtError instanceof ApiError && Object.keys(caughtError.fieldErrors).length > 0) {
        const apiFieldErrors: CourseFieldErrors = {};
        Object.entries(caughtError.fieldErrors).forEach(([field, message]) => {
          if (field in initialForm) apiFieldErrors[field as CourseField] = message;
        });
        setFieldErrors(apiFieldErrors);
        if (Object.keys(apiFieldErrors).length === 0) setError(caughtError.message);
      } else {
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to create the course.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="dashboard-page course-editor-page">
      <Link className="course-editor-back" to="/instructor/courses">
        <ArrowLeft size={17} />
        Back to courses
      </Link>

      <header className="dashboard-header course-editor-header">
        <div>
          <span className="eyebrow">Instructor workspace</span>
          <h1>{isEditing ? 'Edit course' : 'Create a course'}</h1>
          <p>
            {isEditing
              ? 'Update course information and choose whether students can see it.'
              : 'Add the course details now. You can add lessons after the course is created.'}
          </p>
        </div>
      </header>

      <form className="course-editor" onSubmit={handleSubmit} noValidate>
        <div className="course-editor-section">
          <div className="course-editor-section-heading">
            <h2>Course information</h2>
            <p>Fields marked with an asterisk are required.</p>
          </div>

          {isLoading ? <div className="course-editor-loading">Loading course...</div> : (
          <div className="course-editor-fields">
            <div className="course-editor-field course-editor-field-wide">
              <span>Course title *</span>
              <input
                autoFocus={!isEditing}
                maxLength={200}
                placeholder="e.g. AWS Cloud Fundamentals"
                value={form.title}
                aria-invalid={Boolean(fieldErrors.title)}
                aria-describedby={fieldErrors.title ? 'course-title-error' : undefined}
                onChange={(event) => {
                  setForm((current) => ({ ...current, title: event.target.value }));
                  setError('');
                  setFieldErrors((current) => ({ ...current, title: undefined }));
                }}
              />
              {fieldErrors.title && (
                <small className="course-field-error" id="course-title-error">{fieldErrors.title}</small>
              )}
            </div>

            <label className="course-editor-field course-editor-field-wide">
              <span>Description</span>
              <textarea
                rows={6}
                placeholder="Describe what students will learn in this course."
                value={form.description}
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={fieldErrors.description ? 'course-description-error' : undefined}
                onChange={(event) => {
                  setForm((current) => ({ ...current, description: event.target.value }));
                  setError('');
                  setFieldErrors((current) => ({ ...current, description: undefined }));
                }}
              />
              {fieldErrors.description && (
                <small className="course-field-error" id="course-description-error">{fieldErrors.description}</small>
              )}
            </label>

            <label className="course-editor-field">
              <span>Level *</span>
              <select
                value={form.level}
                onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))}
              >
                <option value="Beginner">Beginner</option>
                <option value="Beginner to Intermediate">Beginner to Intermediate</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All levels">All levels</option>
              </select>
            </label>

            <label className="course-editor-field">
              <span>Category *</span>
              <input
                maxLength={100}
                placeholder="e.g. Foundations"
                value={form.category}
                aria-invalid={Boolean(fieldErrors.category)}
                aria-describedby={fieldErrors.category ? 'course-category-error' : undefined}
                onChange={(event) => {
                  setForm((current) => ({ ...current, category: event.target.value }));
                  setFieldErrors((current) => ({ ...current, category: undefined }));
                }}
              />
              {fieldErrors.category && (
                <small className="course-field-error" id="course-category-error">{fieldErrors.category}</small>
              )}
            </label>

            <label className="course-editor-field course-editor-field-wide">
              <span>Thumbnail URL</span>
              <input
                inputMode="url"
                placeholder="https://example.com/course-thumbnail.jpg"
                value={form.thumbnail_url}
                aria-invalid={Boolean(fieldErrors.thumbnail_url)}
                aria-describedby={fieldErrors.thumbnail_url ? 'course-thumbnail-error' : 'course-thumbnail-help'}
                onChange={(event) => {
                  setForm((current) => ({ ...current, thumbnail_url: event.target.value }));
                  setPendingThumbnailFile(null);
                  setPendingThumbnailPreview('');
                  setError('');
                  setFieldErrors((current) => ({ ...current, thumbnail_url: undefined }));
                }}
              />
              {fieldErrors.thumbnail_url ? (
                <small className="course-field-error" id="course-thumbnail-error">{fieldErrors.thumbnail_url}</small>
              ) : (
                <small id="course-thumbnail-help">Optional. The EduCloud logo is used when no valid image is available.</small>
              )}
              <div className="course-thumbnail-preview">
                <img
                  className={pendingThumbnailPreview || form.thumbnail_url ? 'has-course-thumbnail' : undefined}
                  key={pendingThumbnailPreview || form.thumbnail_url || 'default-thumbnail'}
                  src={pendingThumbnailPreview || form.thumbnail_url || logoUrl}
                  alt="Course thumbnail preview"
                  onError={(event) => {
                    event.currentTarget.src = logoUrl;
                  }}
                />
                <span>
                  {pendingThumbnailFile
                    ? `Selected: ${pendingThumbnailFile.name}`
                    : form.thumbnail_url
                      ? 'Thumbnail preview'
                      : 'Default EduCloud thumbnail'}
                </span>
              </div>
              <div className="course-thumbnail-tools">
                <label className="course-thumbnail-upload">
                  <UploadCloud size={17} />
                  {isUploadingThumbnail ? 'Uploading...' : pendingThumbnailFile ? 'Choose another image' : 'Upload image'}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isUploadingThumbnail}
                    onChange={handleThumbnailSelection}
                  />
                </label>
                {(pendingThumbnailPreview || form.thumbnail_url) && (
                  <button
                    type="button"
                    className="course-thumbnail-edit"
                    disabled={isUploadingThumbnail}
                    onClick={() => void handleEditThumbnail()}
                  >
                    <Pencil size={16} /> {isUploadingThumbnail ? 'Preparing...' : 'Edit thumbnail'}
                  </button>
                )}
                <span>JPG, PNG or WebP, up to 10 MB</span>
              </div>
              {thumbnailNotice && <small className="course-upload-notice" role="status">{thumbnailNotice}</small>}
            </label>

            <label className="course-editor-field">
              <span>Price (USD)</span>
              <input
                min="0"
                step="0.01"
                type="number"
                value={form.price}
                aria-invalid={Boolean(fieldErrors.price)}
                aria-describedby={fieldErrors.price ? 'course-price-error' : undefined}
                onChange={(event) => {
                  setForm((current) => ({ ...current, price: Number(event.target.value) }));
                  setError('');
                  setFieldErrors((current) => ({ ...current, price: undefined }));
                }}
              />
              {fieldErrors.price && (
                <small className="course-field-error" id="course-price-error">{fieldErrors.price}</small>
              )}
            </label>

            <label className="course-editor-field">
              <span>Status</span>
              <select
                value={form.status}
                disabled={!isEditing}
                aria-invalid={Boolean(fieldErrors.status)}
                aria-describedby={fieldErrors.status ? 'course-status-error' : undefined}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as CourseCreatePayload['status']
                  }));
                  setError('');
                  setFieldErrors((current) => ({ ...current, status: undefined }));
                }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
              </select>
              {fieldErrors.status && (
                <small className="course-field-error" id="course-status-error">{fieldErrors.status}</small>
              )}
              {!isEditing && <small>The first save always creates a draft. Publishing is unlocked after lessons and a final assessment are added.</small>}
            </label>
          </div>
          )}
        </div>

        {!isLoading && (
          <div className="course-editor-section course-learning-section">
            <div className="course-editor-section-heading">
              <h2>Learning details</h2>
              <p>These items appear on the public course page before students start learning.</p>
            </div>
            <div className="course-learning-fields">
              <CourseListField
                label="What students will learn"
                help="Add clear outcomes students can expect after completing the course."
                placeholder="e.g. Identify core AWS services and their use cases."
                values={form.learning_outcomes}
                onChange={(learning_outcomes) => setForm((current) => ({ ...current, learning_outcomes }))}
              />
              <CourseListField
                label="Requirements"
                help="List prerequisite knowledge, accounts, tools, or equipment."
                placeholder="e.g. A computer with internet access."
                values={form.requirements}
                onChange={(requirements) => setForm((current) => ({ ...current, requirements }))}
              />
            </div>
          </div>
        )}

        {error && <p className="course-editor-error" role="alert">{error}</p>}

        <div className="course-editor-actions">
          <Link className="course-editor-cancel" to="/instructor/courses">Cancel</Link>
          <button className="dashboard-primary-action" type="submit" disabled={isSubmitting || isLoading || isUploadingThumbnail}>
            <Save size={18} />
            {isSubmitting ? 'Saving...' : isEditing ? 'Save changes' : 'Create draft and continue'}
          </button>
        </div>
      </form>

      {!courseId && (
        <section className="course-next-steps" aria-label="Course setup steps">
          <div className="course-editor-section-heading">
            <h2>Available after the draft is created</h2>
            <p>A course ID is required before lessons, uploaded files, and assessment questions can be saved.</p>
          </div>
          <div className="course-next-step-grid">
            <article>
              <BookOpen size={22} />
              <div>
                <strong>Lessons and files</strong>
                <span>Add lesson content, videos, and downloadable materials.</span>
              </div>
            </article>
            <article>
              <ClipboardCheck size={22} />
              <div>
                <strong>Final assignment</strong>
                <span>Add questions, answer options, scoring rules, and publish the assessment.</span>
              </div>
            </article>
          </div>
        </section>
      )}

      {courseId && <CourseCurriculumEditor courseId={courseId} />}
      {courseId && <AssessmentEditor courseId={courseId} />}
      {thumbnailCropSource && (
        <ThumbnailCropEditor
          imageSrc={thumbnailCropSource}
          onCancel={closeThumbnailCrop}
          onSave={handleCroppedThumbnail}
        />
      )}
    </section>
  );
}

export default CreateCoursePage;
