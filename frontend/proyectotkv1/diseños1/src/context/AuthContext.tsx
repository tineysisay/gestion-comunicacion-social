import { createContext, useContext, type ReactNode } from "react";
import type { Usuario, UsuarioRol } from "../data/mockData";

interface AuthContextValue {
  currentUser: Usuario;
  rol: UsuarioRol;
  isAdmin: boolean;
  isDirector: boolean;
  isLector: boolean;
  can: (action: "create" | "edit" | "delete" | "changeEstado") => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
}

export function AuthProvider({ user, children }: { user: Usuario; children: ReactNode }) {
  const isAdmin    = user.rol === "Administrador";
  const isDirector = user.rol === "Director de dependencia";
  const isLector   = user.rol === "Lector";

  // Lectores solo visualizan — no pueden crear, editar, eliminar ni cambiar estado
  const can = (action: "create" | "edit" | "delete" | "changeEstado"): boolean => {
    if (isLector) return false;
    return true;
  };

  return (
    <AuthContext.Provider value={{ currentUser: user, rol: user.rol, isAdmin, isDirector, isLector, can }}>
      {children}
    </AuthContext.Provider>
  );
}
