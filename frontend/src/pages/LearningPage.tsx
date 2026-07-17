import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Download,
  FileText,
  ListVideo,
  Play
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getCourseById } from '../services/courseService';
import { getCourseProgress, setLessonComplete } from '../services/progressService';
import type { LessonRecord } from '../types/course';

type LearningCourse = {
  title: string;
  instructor: string;
  description: string;
  lessons: LessonRecord[];
};

const demoCourses: Record<string, LearningCourse> = {
  'course-1': {
    title: 'Cloud Fundamentals',
    instructor: 'EduCloud Lite Team',
    description: 'Build a clear foundation in cloud computing and understand how modern cloud services work together.',
    lessons: [
      { id: 101, course_id: 1, title: 'Introduction to Cloud Computing', content: 'Learn what cloud computing is, why organizations use it, and the key differences between on-premises and cloud infrastructure.', video_url: null, material_url: null, order_index: 1 },
      { id: 102, course_id: 1, title: 'AWS Global Infrastructure', content: 'Explore Regions, Availability Zones, and edge locations—and see how they help applications stay fast and available.', video_url: null, material_url: null, order_index: 2 },
      { id: 103, course_id: 1, title: 'Core AWS Services', content: 'An overview of compute, storage, databases, and networking services commonly used in cloud applications.', video_url: null, material_url: null, order_index: 3 },
      { id: 104, course_id: 1, title: 'EduCloud Lite Architecture', content: 'Put the concepts together by walking through the architecture of the EduCloud Lite learning platform.', video_url: null, material_url: null, order_index: 4 }
    ]
  },
  'course-3': {
    title: 'AWS S3 File Storage', instructor: 'Morgan Instructor', description: 'Learn how course media and documents are stored and delivered with Amazon S3.',
    lessons: ['S3 Bucket Basics', 'Upload Course Thumbnails', 'Upload Lesson Videos', 'Manage PDF Materials', 'Secure File Access'].map((title, index) => ({ id: 301 + index, course_id: 3, title, content: 'Follow this guided lesson to understand the concept and apply it to EduCloud Lite.', video_url: null, material_url: null, order_index: index + 1 }))
  },
  'course-5': {
    title: 'Monitoring with CloudWatch', instructor: 'EduCloud Lite Team', description: 'Observe application health, logs, and important events with AWS CloudWatch.',
    lessons: ['CloudWatch Log Groups', 'Application Error Logs', 'Monitoring EduCloud Lite Activity'].map((title, index) => ({ id: 501 + index, course_id: 5, title, content: 'Follow this guided lesson to understand the concept and apply it to EduCloud Lite.', video_url: null, material_url: null, order_index: index + 1 }))
  }
};

function LearningPage() {
  const { courseId = '' } = useParams();
  const [course, setCourse] = useState<LearningCourse | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    Promise.all([getCourseById(courseId), getCourseProgress(courseId)])
      .then(([{ data }, progressResponse]) => {
        if (!active || !data) return;
        const sortedLessons = [...data.lessons].sort((a, b) => a.order_index - b.order_index);
        const completedIds = progressResponse.data?.completed_lesson_ids ?? [];
        setCourse({
          title: data.title,
          instructor: `Instructor #${data.instructor_id}`,
          description: data.description || 'Continue through the lessons to complete this course.',
          lessons: sortedLessons
        });
        setCompleted(completedIds);
        const firstIncomplete = sortedLessons.findIndex((lesson) => !completedIds.includes(lesson.id));
        setActiveIndex(firstIncomplete >= 0 ? firstIncomplete : Math.max(sortedLessons.length - 1, 0));
      })
      .catch((caught) => active && setError(caught instanceof Error ? caught.message : 'Unable to load this course.'))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [courseId]);

  const lesson = course?.lessons[activeIndex];
  const progress = useMemo(() => course?.lessons.length
    ? Math.round((completed.length / course.lessons.length) * 100)
    : 0, [completed.length, course?.lessons.length]);

  async function toggleComplete() {
    if (!lesson) return;
    const shouldComplete = !completed.includes(lesson.id);
    await setLessonComplete(lesson.id, shouldComplete);
    const next = !shouldComplete
      ? completed.filter((id) => id !== lesson.id)
      : [...completed, lesson.id];
    setCompleted(next);
  }

  if (isLoading) return <section className="learning-state">Loading your classroom...</section>;
  if (error || !course) return <section className="learning-state learning-state-error"><strong>{error || 'Course not found.'}</strong><Link to="/my-learning">Back to My Learning</Link></section>;

  return (
    <section className="learning-page">
      <header className="learning-topbar">
        <div>
          <Link to="/my-learning" className="learning-back"><ArrowLeft size={16} /> My Learning</Link>
          <h1>{course.title}</h1>
          <p>{course.instructor}</p>
        </div>
        <div className="learning-progress-summary">
          <div><span>Course progress</span><strong>{progress}%</strong></div>
          <div className="learning-progress-track"><span style={{ width: `${progress}%` }} /></div>
          <small>{completed.length} of {course.lessons.length} lessons completed</small>
        </div>
      </header>

      <div className="learning-workspace">
        <main className="lesson-viewer">
          <div className="lesson-media">
            {lesson?.video_url ? (
              <video key={lesson.video_url} controls src={lesson.video_url}>Your browser does not support video playback.</video>
            ) : (
              <div className="lesson-media-placeholder">
                <span><Play fill="currentColor" /></span>
                <strong>{lesson ? 'Lesson ready to study' : 'No lesson selected'}</strong>
                <p>{lesson ? 'Video content has not been uploaded for this lesson yet.' : 'Choose a lesson from the course playlist.'}</p>
              </div>
            )}
          </div>

          {lesson && <>
            <div className="lesson-heading">
              <div><span className="eyebrow">Lesson {activeIndex + 1} of {course.lessons.length}</span><h2>{lesson.title}</h2></div>
              <button className={completed.includes(lesson.id) ? 'lesson-complete is-complete' : 'lesson-complete'} onClick={toggleComplete} type="button">
                {completed.includes(lesson.id) ? <CheckCircle2 /> : <Circle />}
                {completed.includes(lesson.id) ? 'Completed' : 'Mark as complete'}
              </button>
            </div>
            <div className="lesson-navigation">
              <button type="button" disabled={activeIndex === 0} onClick={() => setActiveIndex((value) => value - 1)}><ChevronLeft /> Previous</button>
              <button type="button" disabled={activeIndex === course.lessons.length - 1} onClick={() => setActiveIndex((value) => value + 1)}>Next lesson <ChevronRight /></button>
            </div>
            <article className="lesson-notes">
              <h3>About this lesson</h3>
              <p>{lesson.content || 'The instructor has not added lesson notes yet.'}</p>
              {lesson.material_url && <a href={lesson.material_url} target="_blank" rel="noreferrer"><FileText /><span><strong>Lesson resource</strong><small>Open or download the supporting material</small></span><Download /></a>}
            </article>
          </>}
        </main>

        <aside className="course-playlist">
          <div className="playlist-header"><div><span className="eyebrow">Course content</span><h2>Lessons</h2></div><ListVideo /></div>
          <div className="playlist-list">
            {course.lessons.length === 0 && <div className="playlist-empty">No lessons have been published yet.</div>}
            {course.lessons.map((item, index) => {
              const done = completed.includes(item.id);
              const current = index === activeIndex;
              return <button key={item.id} type="button" className={current ? 'playlist-item is-active' : 'playlist-item'} onClick={() => setActiveIndex(index)}>
                <span className="playlist-status">{done ? <Check /> : current ? <Play fill="currentColor" /> : <span>{index + 1}</span>}</span>
                <span className="playlist-copy"><strong>{item.title}</strong><small><Clock3 /> Self-paced {item.material_url && ' · Resource'}</small></span>
              </button>;
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default LearningPage;
