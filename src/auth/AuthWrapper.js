import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { RenderHeader } from "../components/structure/Header";
import { RenderMenu, RenderRoutes } from "../components/structure/RenderNavigation";
import { API } from "../api/config";
import { GoogleOAuthProvider } from "@react-oauth/google";

const AuthContext = createContext();
export const AuthData = () => useContext(AuthContext);

const GOOGLE_CLIENT_ID = "389529819718-sb52ttlbk8jnt2to2drng5a4vjfq70cm.apps.googleusercontent.com";
const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes

export const AuthWrapper = () => {
  const [user, setUser] = useState(() => {
    // Restore session from sessionStorage on page refresh
    try {
      const saved = sessionStorage.getItem("ft_user");
      return saved ? JSON.parse(saved) : { isAuthenticated: false };
    } catch { return { isAuthenticated: false }; }
  });

  const inactivityTimer = useRef(null);

  const logout = useCallback(() => {
    setUser({ isAuthenticated: false });
    sessionStorage.removeItem("ft_user");
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(logout, INACTIVITY_MS);
  }, [logout]);

  // Set up activity listeners when authenticated
  useEffect(() => {
    if (!user.isAuthenticated) return;
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer(); // start timer
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user.isAuthenticated, resetInactivityTimer]);

  const setAuthUser = (data) => {
    const userState = {
      isAuthenticated: true,
      memberid: data.memberId,
      firstname: data.firstName,
      lastname: data.lastName,
      email: data.email,
      token: data.token,
      emailVerified: data.emailVerified,
      authProvider: data.authProvider,
    };
    setUser(userState);
    sessionStorage.setItem("ft_user", JSON.stringify(userState));
  };

  const login = async (email, password) => {
    const response = await fetch(API.authLogin, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();
    if (response.status === 403 && result.message === "EMAIL_NOT_VERIFIED") {
      throw new Error("EMAIL_NOT_VERIFIED:" + email);
    }
    if (!response.ok) throw new Error(result.message || "Login failed");
    setAuthUser(result.data);
    return result.data;
  };

  const googleLogin = async (idToken) => {
    const response = await fetch(API.authGoogle, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Google login failed");
    setAuthUser(result.data);
    return result.data;
  };

  // Helper: get auth headers for API calls
  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(user.token ? { "Authorization": `Bearer ${user.token}` } : {}),
  });

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContext.Provider value={{ user, login, googleLogin, logout, authHeaders, setAuthUser }}>
        <RenderHeader />
        <RenderMenu />
        <RenderRoutes />
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
};
