import { useState } from "react";
import { USUARIOS, getNombreCompleto, type Usuario } from "../data/mockData";
import { IconUser, IconClose, IconCheck, IconRefresh } from "../components/Icons";

// Demo credentials: username from USUARIOS, password = "direcSA2026"
// Admin shortcut: admin / admin
const DEMO_PASSWORD = "direcSA2026";
const ADMIN_SHORTCUT = { username: "admin", password: "admin" };

interface LoginProps {
  onLogin: (user: Usuario) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Complete todos los campos.");
      return;
    }
    setLoading(true);

    setTimeout(() => {
      // Admin shortcut
      if (username.trim() === ADMIN_SHORTCUT.username && password === ADMIN_SHORTCUT.password) {
        const adminUser = USUARIOS.find((u) => u.rol === "Administrador");
        if (adminUser) { onLogin(adminUser); return; }
      }

      // Match against USUARIOS list
      const match = USUARIOS.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase() && password === DEMO_PASSWORD
      );

      if (match) {
        onLogin(match);
      } else {
        setLoading(false);
        setError("Usuario o contraseña incorrectos. Verifique sus credenciales.");
      }
    }, 800);
  };

  const quickLogin = (u: Usuario) => {
    setUsername(u.username);
    setPassword(DEMO_PASSWORD);
    setError("");
  };

  return (
    <div className="min-h-full flex bg-surface">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:flex-col lg:w-[420px] bg-navy text-white relative overflow-hidden shrink-0">
        {/* Background shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute bottom-10 -left-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute top-1/2 right-8 w-24 h-24 rounded-full bg-white/5" />
        </div>

        <div className="flex flex-col justify-between h-full p-10 relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg">
              SA
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">Municipalidad</p>
              <p className="text-white/60 text-xs">Santiago Atitlán, Sololá</p>
            </div>
          </div>

          {/* Center content */}
          <div>
            <h1 className="text-3xl font-bold leading-tight mb-4">
              Sistema de Gestión Operativa
            </h1>
            <p className="text-white/70 text-base leading-relaxed mb-8">
              Dirección de Comunicación Social — Gestión centralizada de solicitudes, cobertura y personal.
            </p>

            <div className="space-y-3">
              {[
                "Seguimiento mediante tablero Kanban",
                "Planificación en calendario integrado",
                "Reportes y estadísticas en tiempo real",
                "Gestión de solicitudes y solicitantes",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <IconCheck className="w-2.5 h-2.5 text-white" />
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/40 text-xs">
            © 2026 Municipalidad de Santiago Atitlán. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center font-bold text-white text-sm">SA</div>
            <div>
              <p className="font-semibold text-slate-900 text-sm leading-tight">Municipalidad de Santiago Atitlán</p>
              <p className="text-slate-400 text-xs">Dirección de Comunicación Social</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
            <p className="text-slate-500 text-sm mt-1.5">Ingrese sus credenciales institucionales para continuar.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de usuario</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <IconUser className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  placeholder="usuario.apellido"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-navy-dark transition-colors disabled:opacity-60 btn-primary mt-2"
            >
              {loading ? (
                <><IconRefresh className="w-4 h-4 animate-spin" /> Verificando...</>
              ) : (
                "Ingresar al sistema"
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Acceso de demostración
            </p>
            <p className="text-xs text-slate-500 mb-3">
              Contraseña para todos los usuarios: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono">direcSA2026</code>
            </p>
            <div className="space-y-2">
              {USUARIOS.filter((u) => u.estado !== "Inactivo").map((u) => {
                const roleColor =
                  u.rol === "Administrador" ? "bg-navy/10 text-navy" :
                  u.rol === "Director de dependencia" ? "bg-blue-100 text-blue-700" :
                  "bg-slate-100 text-slate-600";
                return (
                  <button
                    key={u.id}
                    onClick={() => quickLogin(u)}
                    className="w-full flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-slate-200 hover:border-navy/30 hover:bg-navy/5 transition-all text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {u.primerNombre[0]}{u.primerApellido[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{getNombreCompleto(u)}</p>
                      <p className="text-[10px] text-slate-400 font-mono">@{u.username}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${roleColor}`}>
                      {u.rol === "Administrador" ? "Admin" : u.rol === "Director de dependencia" ? "Director" : "Lector"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Sistema Web de Gestión Operativa · Dirección de Comunicación Social
          </p>
        </div>
      </div>
    </div>
  );
}
