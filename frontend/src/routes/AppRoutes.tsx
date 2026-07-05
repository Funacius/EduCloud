import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import CourseListPage from '../pages/CourseListPage';
import CourseDetailPage from '../pages/CourseDetailPage';
import MyLearningPage from '../pages/MyLearningPage';
import LearningPage from '../pages/LearningPage';
import InstructorCoursesPage from '../pages/InstructorCoursesPage';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/courses" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/courses" element={<CourseListPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/my-learning" element={<MyLearningPage />} />
        <Route path="/learn/:courseId" element={<LearningPage />} />
        <Route path="/instructor/courses" element={<InstructorCoursesPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
