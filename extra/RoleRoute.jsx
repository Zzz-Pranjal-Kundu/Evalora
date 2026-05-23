import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ROUTES } from "../routes/paths.js";

/**
 * Renders children only when the signed-in user's primary role is allowed.
 *
 * On access denial the component redirects to the home route and passes
 * { accessDenied: true } in location.state.  The denied path is intentionally
 * NOT forwarded — leaking it in state would expose restricted route names to
 * unauthorised users (e.g. via React DevTools or a console log).
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
