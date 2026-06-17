import { createContext, useContext } from "react";
import type { AuthUser } from "@/types";

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loginUser: (token: string, user: AuthUser) => void;
  logoutUser: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

/* Récupère le contexte d'authentification. Disponible partout via useAuth() */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
