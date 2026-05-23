import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ROUTES } from "../routes/paths.js";

/**
 * Renders children only when the signed-in user's primary role is allowed.
 * Otherwise redirects home (dashboard shows a short notice via location.state).
 */
export function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!roles?.length) {
    return children;
  }

  if (user && roles.includes(user.role)) {
    return children;
  }

  return (
    <Navigate
      to={ROUTES.HOME}
      replace
      state={{ accessDenied: true }}
    />
  );
}
