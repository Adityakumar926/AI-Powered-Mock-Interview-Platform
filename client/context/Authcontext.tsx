"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
  clearAuth,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
  StoredUser,
} from "@/lib/auth";

// ── Types ─────────────────────────────────────────────────
interface AuthContextValue {
  user: StoredUser | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;

  logout: () => void;
  refreshUser: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true on first load

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getStoredUser();

    if (storedToken && storedUser) {
      setTokenState(storedToken);
      setUser(storedUser);
    }

    setIsLoading(false);
  }, []);

  // ── Login ───────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const { data } = await axiosInstance.post("/api/auth/login", {
          email,
          password,
        });

        setToken(data.token);
        setStoredUser(data.user);
        setTokenState(data.token);
        setUser(data.user);

        const userRole = data.user?.role || "Student";
        if (userRole === "Mentor" || userRole === "Administrator") {
          router.push("/rbac");
        } else {
          router.push("/dashboard");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  // ── Register ────────────────────────────────────────────
  const register = useCallback(
    async (name: string, email: string, password: string, role?: string) => {
      setIsLoading(true);
      try {
        const { data } = await axiosInstance.post("/api/auth/register", {
          name,
          email,
          password,
          role: role || "Student",
        });

        setToken(data.token);
        setStoredUser(data.user);
        setTokenState(data.token);
        setUser(data.user);

        const userRole = data.user?.role || "Student";
        if (userRole === "Mentor" || userRole === "Administrator") {
          router.push("/rbac");
        } else {
          router.push("/dashboard");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );


  // ── Logout ──────────────────────────────────────────────
  const logout = useCallback(() => {
    clearAuth();
    setTokenState(null);
    setUser(null);
    router.push("/");
  }, [router]);

  // ── Refresh user from API ───────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/api/auth/me");
      setStoredUser(data.user);
      setUser(data.user);
    } catch {
      // token invalid — log out
      logout();
    }
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isLoggedIn: !!token && !!user,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Raw context export (used by useAuth hook) ─────────────
export { AuthContext };
