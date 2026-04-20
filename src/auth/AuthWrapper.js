import { createContext, useContext, useState } from "react";
import { RenderHeader } from "../components/structure/Header";
import { RenderMenu, RenderRoutes } from "../components/structure/RenderNavigation";
import { API } from "../api/config";

const AuthContext = createContext();
export const AuthData = () => useContext(AuthContext);

export const AuthWrapper = () => {
  const [user, setUser] = useState({ name: "", isAuthenticated: false, memberid: null, firstname: "" });

  const login = async (username, password) => {
    try {
      const response = await fetch(API.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.message || "Login failed");
      }

      const result = await response.json();
      const data = result.data;

      if (!data || !data.id) {
        throw new Error("Invalid response format from server");
      }

      setUser({ name: username, isAuthenticated: true, memberid: data.id, firstname: data.firstName });
      return "success";
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser({ name: "", isAuthenticated: false, memberid: null, firstname: "" });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <>
        <RenderHeader />
        <RenderMenu />
        <RenderRoutes />
      </>
    </AuthContext.Provider>
  );
};
