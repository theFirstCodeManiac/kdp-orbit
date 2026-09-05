import React, { createContext, useContext, useState, useEffect } from "react";
import { analytics } from "@/src/services/analytics/analytics.ts";

export interface UserSession {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: "author" | "pro_publisher" | "agency" | "admin";
  country: string;
  preferredCurrency: "NGN" | "USD" | "GBP";
  planId: "free_starter" | "author_pro" | "publisher_elite";
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  sessions: UserSession[];
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    displayName: string,
    country: string,
    preferredCurrency: "NGN" | "USD",
  ) => Promise<{
    success: boolean;
    error?: string;
    verificationToken?: string;
  }>;
  logout: () => Promise<void>;
  updateProfile: (data: {
    displayName?: string;
    country?: string;
    preferredCurrency?: "NGN" | "USD";
  }) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (
    email: string,
  ) => Promise<{ success: boolean; error?: string; devToken?: string }>;
  completePasswordReset: (
    token: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>;
  terminateSession: (
    sessionId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: (
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  testCrossTenantIsolation: (targetUserId: string) => Promise<any>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUserData = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data.user);
        setSessions(data.data.sessions || []);
      } else {
        setToken(null);
        setUser(null);
        setSessions([]);
      }
    } catch (err) {
      console.error("Failed to load user session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  useEffect(() => {
    if (!token) return;
    refreshUserData();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.data.token);
        setUser(data.data.user);
        return { success: true };
      }
      return { success: false, error: data.error?.message || "Login failed" };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
    country: string,
    preferredCurrency: "NGN" | "USD",
  ) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName,
          country,
          preferredCurrency,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.data.token);
        setUser(data.data.user);
        analytics.identify(data.data.user.id);
        analytics.track(
          "account_created",
          {
            plan_id: data.data.user.planId,
            country: data.data.user.country,
            role: data.data.user.role,
          },
          data.data.user.id,
        );
        return {
          success: true,
          verificationToken: data.data.verificationToken,
        };
      }
      return {
        success: false,
        error: data.error?.message || "Registration failed",
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    setToken(null);
    setUser(null);
    setSessions([]);
  };

  const updateProfile = async (dataPayload: {
    displayName?: string;
    country?: string;
    preferredCurrency?: "NGN" | "USD";
  }) => {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(dataPayload),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data.user);
        return { success: true };
      }
      return {
        success: false,
        error: data.error?.message || "Profile update failed",
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        return { success: true };
      }
      return {
        success: false,
        error: data.error?.message || "Password update failed",
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      return {
        success: data.success,
        error: data.error?.message,
        devToken: data.devToken,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const completePasswordReset = async (
    resetToken: string,
    newPassword: string,
  ) => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      const data = await res.json();
      return { success: data.success, error: data.error?.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const verifyEmail = async (verificationToken: string) => {
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data.user);
        return { success: true };
      }
      return { success: false, error: data.error?.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        return { success: true };
      }
      return { success: false, error: data.error?.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteAccount = async (password: string) => {
    try {
      const res = await fetch("/api/auth/account", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        await logout();
        return { success: true };
      }
      return { success: false, error: data.error?.message };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Test server-side authorization: tries accessing targetUserId data
  const testCrossTenantIsolation = async (targetUserId: string) => {
    try {
      const res = await fetch(`/api/auth/test-isolation/${targetUserId}`, {
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      return {
        status: res.status,
        statusText: res.statusText,
        data,
      };
    } catch (err: any) {
      return {
        status: 500,
        error: err.message,
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        sessions,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        updatePassword,
        requestPasswordReset,
        completePasswordReset,
        verifyEmail,
        terminateSession,
        deleteAccount,
        testCrossTenantIsolation,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
