import { useState } from "react";
import {
  ROLES, TIPOS_EMPLEADO, CARGOS, ESTADOS_USUARIO, ESTADOS_KANBAN,
  ROL_COLORS, USUARIO_ESTADO_COLORS, ESTADO_COLORS
} from "../data/mockData";
import Badge from "../components/Badge";
import { IconPlus, IconEdit, IconTrash, IconSettings, IconUsers, IconUser, IconClose, IconCheck } from "../components/Icons";

type ConfigSection = "roles" | "tipos" | "cargos" | "estados-usuario" | "estados-kanban" | "general";

const SECTIONS = [
  { id: "roles" as ConfigSection, label: "Roles de usuario", icon: IconUsers, desc: "Gestión de roles y permisos del sistema" },
  { id: "tipos" as ConfigSection, label: "Tipos de empleado", icon: IconUser, desc: "Clasificaciones de tipo de personal" },
  { id: "cargos" as ConfigSection, label: "Cargos", icon: IconUser, desc: "Cargos del personal de la dependencia" },
  { id: "estados-usuario" as ConfigSection, label: "Estados de usuario", icon: IconUser, desc: "Posibles estados para cuentas de usuario" },
  { id: "estados-kanban" as ConfigSection, label: "Estados del flujo Kanban", icon: IconSettings, desc: "Estados en el tablero de seguimiento" },
  { id: "general" as ConfigSection, label: "Parámetros generales", icon: IconSettings, desc: "Configuración global del sistema" },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  Administrador: [
    "Acceso completo al sistema",
    "Gestión de usuarios y roles",
    "Configuración del sistema",
    "Generación de reportes",
    "Administración de solicitudes",
    "Gestión de solicitantes",
  ],
  "Director de dependencia": [
    "Gestión de solicitudes",
    "Asignación de personal",
    "Consulta de calendario",
    "Generación de reportes limitados",
    "Seguimiento por tablero Kanban",
  ],
  Lector: [
    "Consulta de solicitudes",
    "Consulta de calendario",
    "Vista del tablero Kanban",
    "Sin permisos de modificación",
  ],
};

export default function Configuracion() {
  const [activeSection, setActiveSection] = useState<ConfigSection>("roles");
  const [tipos, setTipos] = useState(TIPOS_EMPLEADO);
  const [cargos, setCargos] = useState(CARGOS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    if (!newValue.trim()) return;
    if (activeSection === "tipos") setTipos((prev) => [...prev, newValue.trim()]);
    if (activeSection === "cargos") setCargos((prev) => [...prev, newValue.trim()]);
    setNewValue("");
    setShowAddModal(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "roles":
        return (
          <div className="space-y-4">
            {ROLES.map((rol) => {
              const c = ROL_COLORS[rol];
              return (
                <div key={rol} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge label={rol} bg={c.bg} text={c.text} />
                    </div>
                    <button className="text-slate-400 hover:text-navy px-2.5 py-1.5 rounded-full hover:bg-blue-50 transition-colors">
                      <IconEdit className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ROLE_PERMISSIONS[rol]?.map((p) => (
                      <div key={p} className="flex items-center gap-2 text-sm text-slate-600">
                        <IconCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );

      case "tipos":
        return (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="font-semibold text-slate-900">Tipos de empleado</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-navy text-white px-3 py-1.5 rounded-lg btn-primary"
              >
                <IconPlus className="w-3.5 h-3.5" /> Agregar
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {tipos.map((t) => (
                <div key={t} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <span className="text-sm text-slate-800 font-medium">{t}</span>
                  <div className="flex gap-1">
                    <button className="px-2.5 py-1.5 text-slate-400 hover:text-navy hover:bg-blue-50 rounded-full transition-colors">
                      <IconEdit className="w-4 h-4" />
                    </button>
                    <button className="px-2.5 py-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "cargos":
        return (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <p className="font-semibold text-slate-900">Cargos del personal</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-navy text-white px-3 py-1.5 rounded-lg btn-primary"
              >
                <IconPlus className="w-3.5 h-3.5" /> Agregar
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {cargos.map((c) => (
                <div key={c} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <span className="text-sm text-slate-800 font-medium">{c}</span>
                  <div className="flex gap-1">
                    <button className="px-2.5 py-1.5 text-slate-400 hover:text-navy hover:bg-blue-50 rounded-full transition-colors">
                      <IconEdit className="w-4 h-4" />
                    </button>
                    <button className="px-2.5 py-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "estados-usuario":
        return (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="font-semibold text-slate-900">Estados de usuario</p>
            </div>
            <div className="divide-y divide-slate-100">
              {ESTADOS_USUARIO.map((e) => {
                const c = USUARIO_ESTADO_COLORS[e];
                return (
                  <div key={e} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                    <Badge label={e} bg={c.bg} text={c.text} dot={c.dot} />
                    <div className="flex gap-1">
                      <button className="px-2.5 py-1.5 text-slate-400 hover:text-navy hover:bg-blue-50 rounded-full transition-colors">
                        <IconEdit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "estados-kanban":
        return (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="font-semibold text-slate-900">Flujo Kanban</p>
              <p className="text-xs text-slate-500 mt-0.5">Define los estados del tablero de seguimiento de solicitudes</p>
            </div>
            <div className="p-5 space-y-3">
              {ESTADOS_KANBAN.map((e, i) => {
                const c = ESTADO_COLORS[e];
                return (
                  <div key={e} className="flex items-center gap-4 bg-slate-50 rounded-lg px-4 py-3">
                    <span className="w-5 h-5 rounded-full bg-slate-300 text-white text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <Badge label={e} bg={c.bg} text={c.text} dot={c.dot} />
                    <div className="flex-1 text-xs text-slate-500">
                      {e === "Pendiente" && "Solicitud recibida, sin procesar."}
                      {e === "En proceso" && "En revisión y organización."}
                      {e === "Programada" && "Personal asignado, lista para ejecutar."}
                      {e === "En ejecución" && "Actividad en curso."}
                      {e === "Finalizada" && "Actividad completada y archivada."}
                    </div>
<button className="px-2.5 py-1.5 text-slate-400 hover:text-navy hover:bg-blue-50 rounded-full transition-colors">
                      <IconEdit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "general":
        return (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="font-semibold text-slate-900">Parámetros generales del sistema</p>
            </div>
            <div className="p-6 space-y-5">
              {[
                { label: "Nombre del sistema", value: "Sistema Web de Gestión Operativa de Comunicación Social" },
                { label: "Institución", value: "Municipalidad de Santiago Atitlán, Sololá, Guatemala" },
                { label: "Dependencia", value: "Dirección de Comunicación Social" },
                { label: "Versión del sistema", value: "1.0.0 — Septiembre 2026" },
                { label: "Zona horaria", value: "UTC-6 (Guatemala)" },
                { label: "Idioma", value: "Español (Guatemala)" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm text-slate-800 font-medium">{value}</p>
                  </div>
                  <button className="shrink-0 text-slate-400 hover:text-navy hover:bg-blue-50 px-2.5 py-1.5 rounded-full transition-colors">
                    <IconEdit className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-bold text-slate-900 text-lg">Configuración</h2>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">Solo Administrador</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {SECTIONS.map(({ id, label, icon: Icon, desc }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-slate-100 last:border-b-0 transition-colors
                  ${activeSection === id ? "bg-navy/5 border-l-2 border-l-navy" : "hover:bg-slate-50"}`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${activeSection === id ? "text-navy" : "text-slate-400"}`} />
                <div>
                  <p className={`text-sm font-medium ${activeSection === id ? "text-navy" : "text-slate-700"}`}>{label}</p>
                  <p className="text-xs text-slate-400 leading-snug mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {renderContent()}
        </div>
      </div>

      {/* Add modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">
                {activeSection === "tipos" ? "Nuevo tipo de empleado" : "Nuevo cargo"}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <IconClose className="w-5 h-5" />
              </button>
            </div>
            <input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Nombre..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 mb-4"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!newValue.trim()}
                className="flex-1 bg-navy text-white text-sm font-semibold py-2.5 rounded-lg btn-primary disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                onClick={() => { setShowAddModal(false); setNewValue(""); }}
                className="px-4 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
