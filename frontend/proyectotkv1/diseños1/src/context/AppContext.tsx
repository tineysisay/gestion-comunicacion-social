import { createContext, useContext, useState, type ReactNode } from "react";
import {
  SOLICITUDES as INIT_SOL,
  USUARIOS as INIT_USR,
  SOLICITANTES as INIT_SOL_ANTES,
  type Solicitud,
  type Usuario,
  type Solicitante,
  type SolicitudEstado,
} from "../data/mockData";

interface AppState {
  solicitudes: Solicitud[];
  setSolicitudes: React.Dispatch<React.SetStateAction<Solicitud[]>>;
  addSolicitud: (s: Solicitud) => void;
  updateSolicitud: (s: Solicitud) => void;
  deleteSolicitud: (id: string) => void;

  usuarios: Usuario[];
  setUsuarios: React.Dispatch<React.SetStateAction<Usuario[]>>;
  addUsuario: (u: Usuario) => void;
  updateUsuario: (u: Usuario) => void;
  deleteUsuario: (id: string) => void;

  solicitantes: Solicitante[];
  setSolicitantes: React.Dispatch<React.SetStateAction<Solicitante[]>>;
  addSolicitante: (s: Solicitante) => void;
  updateSolicitante: (s: Solicitante) => void;
  deleteSolicitante: (id: string) => void;

  changeSolicitudEstado: (id: string, estado: SolicitudEstado) => void;
}

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(INIT_SOL);
  const [usuarios, setUsuarios] = useState<Usuario[]>(INIT_USR);
  const [solicitantes, setSolicitantes] = useState<Solicitante[]>(INIT_SOL_ANTES);

  const addSolicitud = (s: Solicitud) => setSolicitudes((p) => [s, ...p]);
  const updateSolicitud = (s: Solicitud) => setSolicitudes((p) => p.map((x) => (x.id === s.id ? s : x)));
  const deleteSolicitud = (id: string) => setSolicitudes((p) => p.filter((x) => x.id !== id));
  const changeSolicitudEstado = (id: string, estado: SolicitudEstado) =>
    setSolicitudes((p) => p.map((x) => (x.id === id ? { ...x, estado, updatedAt: new Date().toISOString().split("T")[0] } : x)));

  const addUsuario = (u: Usuario) => setUsuarios((p) => [u, ...p]);
  const updateUsuario = (u: Usuario) => setUsuarios((p) => p.map((x) => (x.id === u.id ? u : x)));
  const deleteUsuario = (id: string) => setUsuarios((p) => p.filter((x) => x.id !== id));

  const addSolicitante = (s: Solicitante) => setSolicitantes((p) => [s, ...p]);
  const updateSolicitante = (s: Solicitante) => setSolicitantes((p) => p.map((x) => (x.id === s.id ? s : x)));
  const deleteSolicitante = (id: string) => setSolicitantes((p) => p.filter((x) => x.id !== id));

  return (
    <AppContext.Provider
      value={{
        solicitudes, setSolicitudes, addSolicitud, updateSolicitud, deleteSolicitud,
        usuarios, setUsuarios, addUsuario, updateUsuario, deleteUsuario,
        solicitantes, setSolicitantes, addSolicitante, updateSolicitante, deleteSolicitante,
        changeSolicitudEstado,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
