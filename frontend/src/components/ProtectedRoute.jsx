import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ROUTES } from "../routes/paths.js";

export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  if (roles && roles.length && user && !roles.includes(user.role)) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
}
