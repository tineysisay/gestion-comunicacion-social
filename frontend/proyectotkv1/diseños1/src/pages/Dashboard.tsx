import { getSolicitanteById, ESTADO_COLORS } from "../data/mockData";
import { useApp } from "../context/AppContext";
import Badge from "../components/Badge";
import {
  IconClipboard, IconKanban, IconCalendar, IconBarChart,
  IconArrowRight, IconClock, IconMapPin, IconExclamation
} from "../components/Icons";
import type { PageId } from "../components/Layout";

interface DashboardProps {
  onNavigate: (page: PageId) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { solicitudes: SOL } = useApp();
  const pendientes = SOL.filter((s) => s.estado === "Pendiente");
  const enProceso = SOL.filter((s) => s.estado === "En proceso");
  const programadas = SOL.filter((s) => s.estado === "Programada");
  const finalizadas = SOL.filter((s) => s.estado === "Finalizada");
  const enEjecucion = SOL.filter((s) => s.estado === "En ejecución");

  const proximas = [...SOL]
    .filter((s) => s.estado !== "Finalizada")
    .sort((a, b) => a.fechaActividad.localeCompare(b.fechaActividad))
    .slice(0, 5);

  const stats = [
    { label: "Total solicitudes", value: SOL.length, color: "bg-slate-800", text: "text-slate-800", lightBg: "bg-slate-50" },
    { label: "Pendientes", value: pendientes.length, color: "bg-amber-500", text: "text-amber-600", lightBg: "bg-amber-50" },
    { label: "En proceso", value: enProceso.length, color: "bg-blue-500", text: "text-blue-600", lightBg: "bg-blue-50" },
    { label: "Finalizadas", value: finalizadas.length, color: "bg-green-500", text: "text-green-600", lightBg: "bg-green-50" },
    { label: "Programadas", value: programadas.length, color: "bg-purple-500", text: "text-purple-600", lightBg: "bg-purple-50" },
    { label: "En ejecución", value: enEjecucion.length, color: "bg-orange-500", text: "text-orange-600", lightBg: "bg-orange-50" },
  ];

  const quickLinks = [
    { label: "Nueva solicitud", desc: "Registrar cobertura", page: "solicitudes" as PageId, icon: IconClipboard, color: "bg-navy text-white" },
    { label: "Tablero Kanban", desc: "Ver flujo de trabajo", page: "kanban" as PageId, icon: IconKanban, color: "bg-blue-600 text-white" },
    { label: "Calendario", desc: "Ver actividades", page: "calendario" as PageId, icon: IconCalendar, color: "bg-purple-600 text-white" },
    { label: "Reportes", desc: "Generar informes", page: "reportes" as PageId, icon: IconBarChart, color: "bg-emerald-600 text-white" },
  ];

  const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Welcome */}
      <div className="bg-navy rounded-xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full opacity-5">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="150" cy="50" r="80" fill="white" />
            <circle cx="50" cy="150" r="60" fill="white" />
          </svg>
        </div>
        <div className="relative z-10">
          <p className="text-white/60 text-sm font-medium mb-1">Bienvenida de regreso</p>
          <h2 className="text-2xl font-bold text-white mb-1">Ana García Ramos</h2>
          <p className="text-white/70 text-sm">
            Dirección de Comunicación Social · Municipalidad de Santiago Atitlán
          </p>
          <p className="text-white/50 text-xs mt-3">
            Viernes 5 de septiembre de 2026 · Rol: Administrador
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white rounded-xl p-4 border border-slate-100 shadow-sm`}>
            <div className={`text-3xl font-bold ${s.text} mb-1`}>{s.value}</div>
            <div className="text-slate-500 text-xs font-medium leading-tight">{s.label}</div>
            <div className={`mt-3 h-1 rounded-full ${s.lightBg}`}>
              <div
                className={`h-1 rounded-full ${s.color}`}
                style={{ width: `${Math.round((s.value / SOL.length) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming activities */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Próximas actividades</h3>
            <button
              onClick={() => onNavigate("calendario")}
              className="text-xs text-navy font-medium hover:underline flex items-center gap-1"
            >
              Ver calendario <IconArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {proximas.map((s) => {
              const colors = ESTADO_COLORS[s.estado];
              const sol = getSolicitanteById(s.solicitanteId);
              return (
                <div key={s.id} className="flex gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="shrink-0 w-12 text-center pt-0.5">
                    <p className="text-xs text-slate-400 font-medium">
                      {new Date(s.fechaActividad + "T12:00:00").toLocaleDateString("es-GT", { month: "short" }).toUpperCase()}
                    </p>
                    <p className="text-xl font-bold text-slate-800 leading-tight">
                      {new Date(s.fechaActividad + "T12:00:00").getDate()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">{s.actividad}</p>
                      <Badge label={s.estado} bg={colors.bg} text={colors.text} dot={colors.dot} size="xs" />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><IconClock className="w-3 h-3" />{s.horaInicio}–{s.horaFin}</span>
                      <span className="flex items-center gap-1 truncate"><IconMapPin className="w-3 h-3 shrink-0" />{s.lugar}</span>
                    </div>
                    {sol && <p className="text-xs text-slate-400 mt-0.5">{sol.nombre}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Quick links */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Accesos rápidos</h3>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {quickLinks.map(({ label, desc, page, icon: Icon, color }) => (
                <button
                  key={page}
                  onClick={() => onNavigate(page)}
                  className={`${color} rounded-lg p-3 text-left hover:opacity-90 transition-opacity`}
                >
                  <Icon className="w-5 h-5 mb-2 opacity-90" />
                  <p className="text-xs font-semibold leading-tight">{label}</p>
                  <p className="text-[10px] opacity-70 mt-0.5 leading-tight">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Pending alerts */}
          {pendientes.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <IconExclamation className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">Solicitudes pendientes</p>
              </div>
              <div className="space-y-2">
                {pendientes.slice(0, 3).map((s) => (
                  <div key={s.id} className="bg-white rounded-lg px-3 py-2 border border-amber-100">
                    <p className="text-xs font-medium text-slate-800 truncate">{s.actividad}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(s.fechaActividad)}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onNavigate("solicitudes")}
                className="mt-3 text-xs text-amber-700 font-medium hover:underline flex items-center gap-1"
              >
                Ver todas <IconArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
