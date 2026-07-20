import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import VerifyEmailPage from '../pages/VerifyEmailPage';
import ResetCodePage from '../pages/ResetCodePage';
import NewPasswordPage from '../pages/NewPasswordPage';
import CourseListPage from '../pages/CourseListPage';
import CourseDetailPage from '../pages/CourseDetailPage';
import MyLearningPage from '../pages/MyLearningPage';
import LearningPage from '../pages/LearningPage';
import StudentProfilePage from '../pages/StudentProfilePage';
import AssessmentPage from '../pages/AssessmentPage';
import CertificatePage from '../pages/CertificatePage';
import InstructorCoursesPage from '../pages/InstructorCoursesPage';
import CreateCoursePage from '../pages/CreateCoursePage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import AdminHealthPage from '../pages/AdminHealthPage';
import RequireRole from '../components/RequireRole';
import { getRoleHome, useAuth } from '../auth/AuthContext';

function RoleHomeRedirect() {
  const { currentUser } = useAuth();
  return <Navigate to={currentUser ? getRoleHome(currentUser.role) : '/courses'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<RoleHomeRedirect />} />
        <Route path="/dashboard" element={<RoleHomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/forgot-password/code" element={<ResetCodePage />} />
        <Route path="/forgot-password/reset" element={<NewPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/courses" element={<CourseListPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route
          path="/my-learning"
          element={
            <RequireRole allow={['student']}>
              <MyLearningPage />
            </RequireRole>
          }
        />
        <Route
          path="/learn/:courseId"
          element={
            <RequireRole allow={['student']}>
              <LearningPage />
            </RequireRole>
          }
        />
        <Route path="/profile" element={<RequireRole allow={['student']}><StudentProfilePage /></RequireRole>} />
        <Route path="/learn/:courseId/assessment" element={<RequireRole allow={['student']}><AssessmentPage /></RequireRole>} />
        <Route path="/certificates/:certificateId" element={<RequireRole allow={['student']}><CertificatePage /></RequireRole>} />
        <Route
          path="/instructor/courses"
          element={
            <RequireRole allow={['instructor']}>
              <InstructorCoursesPage />
            </RequireRole>
          }
        />
        <Route
          path="/instructor/courses/new"
          element={
            <RequireRole allow={['instructor']}>
              <CreateCoursePage />
            </RequireRole>
          }
        />
        <Route
          path="/instructor/courses/:courseId/edit"
          element={
            <RequireRole allow={['instructor']}>
              <CreateCoursePage />
            </RequireRole>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRole allow={['admin']}>
              <AdminDashboardPage />
            </RequireRole>
          }
        />
        <Route path="/admin/health" element={<RequireRole allow={['admin']}><AdminHealthPage /></RequireRole>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
