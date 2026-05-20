/**
 * MVC View: shapes auth endpoints return to clients.
 */
export function authSessionResponse({ user, accessToken, refreshToken }) {
  return { user, accessToken, refreshToken };
}

export function registerResponse(result, fullNameFromBody) {
  return {
    ...authSessionResponse(result),
    profileHint: { fullName: fullNameFromBody || null },
  };
}

export function meResponse(payload) {
  return {
    sub: payload.sub,
    email: payload.email,
    roles: payload.roles,
  };
}
