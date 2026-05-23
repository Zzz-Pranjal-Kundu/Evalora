import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ProtectedRoute } from "../components/ProtectedRoute.jsx";
import { RoleRoute } from "../components/RoleRoute.jsx";
import { AppLayout } from "../components/AppLayout.jsx";
import {
  ANALYTICS_ROLE_LIST,
  HR_HUB_ROLE_LIST,
  LEADERSHIP_ROLE_LIST,
  ORG_ROLE_LIST,
  CALIBRATION_ROLE_LIST,
  SUPER_ADMIN_ROLE_LIST,
} from "../config/rbac.js";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Profile from "../pages/Profile.jsx";
import Reviews from "../pages/Reviews.jsx";
import FeedbackPage from "../pages/FeedbackPage.jsx";
import NotificationsPage from "../pages/NotificationsPage.jsx";
import AnalyticsPage from "../pages/AnalyticsPage.jsx";
import SelfAssessmentPage from "../pages/SelfAssessmentPage.jsx";
import DevelopmentPage from "../pages/DevelopmentPage.jsx";
import RecognitionPage from "../pages/RecognitionPage.jsx";
import CompetenciesPage from "../pages/CompetenciesPage.jsx";
import ModulePlaceholder from "../pages/ModulePlaceholder.jsx";
import OrganizationPage from "../pages/OrganizationPage.jsx";
import HRHubPage from "../pages/HRHubPage.jsx";
import { ROUTES } from "./paths.js";

/**
 * Application route tree (react-router-dom).
 * Auth shell lives in `main.jsx` (BrowserRouter + AuthProvider).
 */
export function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path={ROUTES.LOGIN}
        element={isAuthenticated ? <Navigate to={ROUTES.HOME} replace /> : <Login />}
      />
      <Route
        path={ROUTES.REGISTER}
        element={isAuthenticated ? <Navigate to={ROUTES.HOME} replace /> : <Register />}
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.HOME} element={<Dashboard />} />
        <Route path={ROUTES.PROFILE} element={<Profile />} />
        <Route path={ROUTES.REVIEWS} element={<Reviews />} />
        <Route path={ROUTES.FEEDBACK} element={<FeedbackPage />} />
        <Route path={ROUTES.SELF_ASSESSMENT} element={<SelfAssessmentPage />} />
        <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
        <Route
          path={ROUTES.ANALYTICS}
          element={
            <RoleRoute roles={ANALYTICS_ROLE_LIST}>
              <AnalyticsPage />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.ORG}
          element={
            <RoleRoute roles={ORG_ROLE_LIST}>
              <OrganizationPage />
            </RoleRoute>
          }
        />
        <Route path={ROUTES.COMPETENCIES} element={<CompetenciesPage />} />
        <Route
          path={ROUTES.CALIBRATION}
          element={
            <RoleRoute roles={CALIBRATION_ROLE_LIST}>
              <ModulePlaceholder title="Calibration" description="Distribution views and adjustment workflow." />
            </RoleRoute>
          }
        />
        <Route path={ROUTES.DEVELOPMENT} element={<DevelopmentPage />} />
        <Route path={ROUTES.RECOGNITION} element={<RecognitionPage />} />
        <Route
          path={ROUTES.HR}
          element={
            <RoleRoute roles={HR_HUB_ROLE_LIST}>
              <HRHubPage />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.LEADERSHIP}
          element={
            <RoleRoute roles={LEADERSHIP_ROLE_LIST}>
              <ModulePlaceholder
                title="Leadership insights"
                description="Executive dashboards for performance distribution and feedback adoption—aggregated and anonymized where required—so leaders steer strategy and culture with data, not spreadsheets."
              />
            </RoleRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN}
          element={
            <RoleRoute roles={SUPER_ADMIN_ROLE_LIST}>
              <ModulePlaceholder title="System administration" description="Audit logs, integrations, and settings." />
            </RoleRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
