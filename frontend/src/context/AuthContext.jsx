import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { api } from "../api/index.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("epfms_token"));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("epfms_refresh"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("epfms_user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem("epfms_token", token);
    else localStorage.removeItem("epfms_token");
  }, [token]);

  useEffect(() => {
    if (refreshToken) localStorage.setItem("epfms_refresh", refreshToken);
    else localStorage.removeItem("epfms_refresh");
  }, [refreshToken]);

  useEffect(() => {
    if (user) localStorage.setItem("epfms_user", JSON.stringify(user));
    else localStorage.removeItem("epfms_user");
  }, [user]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    setToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    setUser(data.user);
    return data;
  };

  const refreshSession = async () => {
    if (!refreshToken) throw new Error("No refresh token");
    const { data } = await api.post("/auth/refresh", { refreshToken });
    setToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      refreshToken,
      user,
      login,
      register,
      refreshSession,
      logout,
      isAuthenticated: !!token,
    }),
    [token, refreshToken, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
