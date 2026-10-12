import { useState } from "react";
import {
  IconKanban, IconClipboard, IconCalendar, IconUsers,
  IconBarChart, IconPeople, IconSettings, IconBell, IconUser,
  IconChevronDown, IconLogout, IconMenu, IconClose
} from "./Icons";
import ConfirmDialog from "./ConfirmDialog";
import type { Usuario } from "../data/mockData";

const LECTOR_ALLOWED: PageId[] = ["kanban", "solicitudes", "calendario"];

export type PageId =
  | "kanban" | "solicitudes" | "calendario"
  | "usuarios" | "reportes" | "solicitantes" | "configuracion";

interface NavItem {
  id: PageId;
  label: string;
  Icon: React.FC<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "kanban",        label: "Tablero Kanban",   Icon: IconKanban },
  { id: "solicitudes",   label: "Solicitudes",      Icon: IconClipboard },
  { id: "calendario",    label: "Calendario",       Icon: IconCalendar },
  { id: "usuarios",      label: "Usuarios",         Icon: IconUsers },
  { id: "reportes",      label: "Reportes",         Icon: IconBarChart },
  { id: "solicitantes",  label: "Solicitantes",     Icon: IconPeople },
  { id: "configuracion", label: "Configuración",    Icon: IconSettings },
];

interface LayoutProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  onLogout: () => void;
  currentUser: Usuario;
  children: React.ReactNode;
}

export default function Layout({ activePage, onNavigate, onLogout, currentUser, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const isLector = currentUser.rol === "Lector";
  const visibleNav = isLector ? NAV_ITEMS.filter((n) => LECTOR_ALLOWED.includes(n.id)) : NAV_ITEMS;
  const activeItem = NAV_ITEMS.find((n) => n.id === activePage);
  const initials = `${currentUser.primerNombre[0]}${currentUser.primerApellido[0]}`;
  const nombreCorto = `${currentUser.primerNombre} ${currentUser.primerApellido}`;

  const rolLabel =
    currentUser.rol === "Administrador" ? "Administrador" :
    currentUser.rol === "Director de dependencia" ? "Director" : "Lector";

  return (
    <div className="flex h-full overflow-hidden bg-surface">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-navy text-white shrink-0 transition-all duration-200 ease-in-out ${
          sidebarOpen ? "w-60" : "w-0 overflow-hidden"
        }`}
        style={{ minWidth: sidebarOpen ? "15rem" : 0 }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">SA</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-xs leading-tight truncate">Dir. Comunicación Social</p>
            <p className="text-white/50 text-[10px] leading-tight truncate">Muni. Santiago Atitlán</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {isLector && (
            <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-400/30">
              <p className="text-amber-200 text-[10px] font-semibold uppercase tracking-wide">Modo lectura</p>
              <p className="text-amber-300/70 text-[9px] leading-tight mt-0.5">Acceso limitado — solo visualización</p>
            </div>
          )}
          {visibleNav.map(({ id, label, Icon }) => {
            const isActive = activePage === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`sidebar-item w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-left
                  ${isActive ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/8 hover:text-white"}`}
              >
                <span className={`shrink-0 ${isActive ? "text-white" : "text-white/50"}`}>
                  <Icon className="w-4.5 h-4.5" />
                </span>
                <span className="truncate">{label}</span>
                {isActive && <span className="ml-auto w-1 h-4 rounded-full bg-white/60" />}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">{nombreCorto}</p>
              <p className="text-white/50 text-[10px] truncate">{rolLabel}</p>
            </div>
            <button
              onClick={() => setConfirmLogout(true)}
              title="Cerrar sesión"
              className="text-white/40 hover:text-white/80 transition-colors shrink-0 p-1 rounded hover:bg-white/10"
            >
              <IconLogout className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-4 bg-white border-b border-slate-200 px-5 py-3 shrink-0 z-10">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-slate-800 transition-colors p-1">
            {sidebarOpen ? <IconClose className="w-5 h-5" /> : <IconMenu className="w-5 h-5" />}
          </button>

          <div className="flex-1 min-w-0 flex items-center gap-3">
            <div>
              <h1 className="text-slate-900 font-semibold text-base truncate">{activeItem?.label ?? "Sistema"}</h1>
              <p className="text-slate-400 text-xs">Sistema de Gestión Operativa de Comunicación Social</p>
            </div>
            {isLector && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wide border border-amber-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Solo lectura
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <IconBell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 text-sm">Notificaciones</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {[
                      { msg: "Nueva solicitud: Feria del Agricultor", time: "Hace 5 min", unread: true },
                      { msg: "SOL-2026-004 cambiada a Programada", time: "Hace 2 hrs", unread: true },
                      { msg: "Reporte mensual disponible", time: "Ayer", unread: false },
                    ].map((n, i) => (
                      <div key={i} className={`px-4 py-3 hover:bg-slate-50 cursor-pointer ${n.unread ? "bg-blue-50/50" : ""}`}>
                        <p className="text-sm text-slate-800">{n.msg}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-slate-100">
                    <button className="text-xs text-navy font-medium hover:underline">Ver todas</button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center text-white text-xs font-semibold">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-slate-900 leading-tight">{nombreCorto}</p>
                  <p className="text-xs text-slate-400 leading-tight">{rolLabel}</p>
                </div>
                <IconChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 text-sm">{`${currentUser.primerNombre} ${currentUser.primerApellido} ${currentUser.segundoApellido}`}</p>
                    <p className="text-xs text-slate-400">{currentUser.email}</p>
                    <p className="text-xs text-slate-400 mt-0.5">@{currentUser.username}</p>
                  </div>
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      <IconUser className="w-4 h-4 text-slate-400" /> Mi perfil
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      <IconSettings className="w-4 h-4 text-slate-400" /> Preferencias
                    </button>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => { setProfileOpen(false); setConfirmLogout(true); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                      >
                        <IconLogout className="w-4 h-4" /> Cerrar sesión
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Backdrop */}
      {(profileOpen || notifOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setProfileOpen(false); setNotifOpen(false); }} />
      )}

      {/* Logout confirm */}
      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={onLogout}
        title="¿Cerrar sesión?"
        message={`Está a punto de cerrar la sesión de ${nombreCorto}. Deberá ingresar sus credenciales nuevamente para acceder al sistema.`}
        confirmLabel="Sí, cerrar sesión"
        variant="warning"
      />
    </div>
  );
}
