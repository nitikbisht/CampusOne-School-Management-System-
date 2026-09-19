"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { login, logout, getCurrentUser, type User, type AuthState } from "./auth";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshUser = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const user = await getCurrentUser();
      setState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
      });
    } catch {
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    const { data } = await login(email, password);
    setState({ user : data.user, isLoading: false, isAuthenticated: true });
  };

  const handleLogout = async () => {
    await logout();
    setState({ user: null, isLoading: false, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login: handleLogin, logout: handleLogout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}