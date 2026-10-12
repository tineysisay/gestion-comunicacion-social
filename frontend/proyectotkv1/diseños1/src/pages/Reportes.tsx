import { useState } from "react";
import {
  ESTADO_COLORS, PRIORIDAD_COLORS, getSolicitanteById, KANBAN_COLUMNS,
  getNombreCompleto, getUsuarioById,
} from "../data/mockData";
import { useApp } from "../context/AppContext";
import Badge from "../components/Badge";
import {
  IconDownload, IconBarChart, IconDocument, IconCalendar,
  IconUser, IconChevronDown, IconPeople, IconUsers, IconSearch,
} from "../components/Icons";

// ── Accordion ──────────────────────────────────────────────────────────────
interface AccordionItem {
  id: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  description: string;
  badge?: string;
  badgeColor?: string;
  content: React.ReactNode;
}

function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
      {items.map(({ id, label, icon: Icon, description, badge, badgeColor, content }) => {
        const isOpen = open === id;
        return (
          <div key={id}>
            <button
              onClick={() => setOpen(isOpen ? null : id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors
                ${isOpen ? "bg-navy/5" : "bg-white hover:bg-slate-50"}`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
                ${isOpen ? "bg-navy text-white" : "bg-slate-100 text-slate-500"}`}>
                <Icon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold leading-tight ${isOpen ? "text-navy" : "text-slate-800"}`}>
                    {label}
                  </p>
                  {badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeColor ?? "bg-slate-200 text-slate-600"}`}>
                      {badge}
                    </span>
                  )}
                </div>
                {!isOpen && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{description}</p>
                )}
              </div>
              <IconChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-navy" : ""}`}
              />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 pt-2 bg-navy/3 border-t border-navy/10">
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">{description}</p>
                {content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Reportes page ──────────────────────────────────────────────────────────
export default function Reportes() {
  const { solicitudes: SOLICITUDES, usuarios: USUARIOS } = useApp();
  const [dateFrom, setDateFrom] = useState("2026-09-01");
  const [dateTo,   setDateTo]   = useState("2026-09-30");
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [showPreview, setShowPreview]   = useState(false);

  const filtered = SOLICITUDES.filter((s) => {
    const inRange = s.fechaActividad >= dateFrom && s.fechaActividad <= dateTo;
    const matchE  = filterEstado === "Todos" || s.estado === filterEstado;
    return inRange && matchE;
  });

  const countByEstado = KANBAN_COLUMNS.map((e) => ({
    estado: e,
    count:  SOLICITUDES.filter((s) => s.estado === e).length,
  }));
  const maxCount = Math.max(...countByEstado.map((c) => c.count), 1);

  const solicitanteCounts = (() => {
    const counts: Record<string, { nombre: string; dep: string; count: number }> = {};
    SOLICITUDES.forEach((s) => {
      const sol = getSolicitanteById(s.solicitanteId);
      if (!sol) return;
      if (!counts[s.solicitanteId]) counts[s.solicitanteId] = { nombre: sol.nombre, dep: sol.dependencia, count: 0 };
      counts[s.solicitanteId].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  })();

  const personalCounts = (() => {
    const counts: Record<string, number> = {};
    SOLICITUDES.forEach((s) => {
      s.asignados.forEach((uid) => {
        counts[uid] = (counts[uid] ?? 0) + 1;
      });
      if (s.responsableId) counts[s.responsableId] = (counts[s.responsableId] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([uid, total]) => ({ usuario: getUsuarioById(uid), total }))
      .filter((x) => x.usuario)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  })();

  const stats = [
    { label: "Total", value: SOLICITUDES.length, color: "bg-slate-700", light: "bg-slate-100", text: "text-slate-800" },
    { label: "Pendientes",  value: SOLICITUDES.filter((s) => s.estado === "Pendiente").length,   color: "bg-amber-500",  light: "bg-amber-50",  text: "text-amber-700" },
    { label: "En proceso",  value: SOLICITUDES.filter((s) => s.estado === "En proceso").length,  color: "bg-blue-500",   light: "bg-blue-50",   text: "text-blue-700" },
    { label: "Programadas", value: SOLICITUDES.filter((s) => s.estado === "Programada").length,  color: "bg-purple-500", light: "bg-purple-50", text: "text-purple-700" },
    { label: "Finalizadas", value: SOLICITUDES.filter((s) => s.estado === "Finalizada").length,  color: "bg-green-500",  light: "bg-green-50",  text: "text-green-700" },
  ];

  // ── Accordion report items ───────────────────────────────────────────────
  const acordeonItems: AccordionItem[] = [
    {
      id: "estado",
      label: "Solicitudes por estado",
      icon: IconBarChart,
      description: "Distribución de todas las solicitudes agrupadas por su estado operativo actual.",
      badge: `${SOLICITUDES.length} total`,
      badgeColor: "bg-slate-200 text-slate-600",
      content: (
        <div className="space-y-2.5">
          {countByEstado.map(({ estado, count }) => {
            const c   = ESTADO_COLORS[estado];
            const pct = Math.round((count / maxCount) * 100);
            return (
              <div key={estado} className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 w-28 shrink-0 justify-end">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <span className={`text-xs font-semibold ${c.text}`}>{estado}</span>
                </div>
                <div className="flex-1 h-5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${c.dot} transition-all duration-700`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-bold text-slate-700 w-5 text-right shrink-0">{count}</span>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      id: "periodo",
      label: "Actividades por período",
      icon: IconCalendar,
      description: "Filtrado de solicitudes dentro de un rango de fechas con control de estado.",
      badge: `${filtered.length} en rango`,
      badgeColor: "bg-blue-100 text-blue-700",
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Desde</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white" />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Hasta</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Estado</label>
            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white">
              <option value="Todos">Todos los estados</option>
              {KANBAN_COLUMNS.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: "En rango",   v: filtered.length,                                      color: "text-navy" },
              { label: "Finalizadas", v: filtered.filter((s) => s.estado === "Finalizada").length, color: "text-green-600" },
              { label: "Pendientes",  v: filtered.filter((s) => s.estado === "Pendiente").length,  color: "text-amber-600" },
            ].map((x) => (
              <div key={x.label} className="bg-white rounded-lg p-2.5 text-center border border-slate-200">
                <p className={`text-xl font-bold ${x.color}`}>{x.v}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{x.label}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "realizadas",
      label: "Actividades realizadas",
      icon: IconDocument,
      description: "Listado de solicitudes con estado Finalizada, con detalle de lugar y horario.",
      badge: `${SOLICITUDES.filter((s) => s.estado === "Finalizada").length}`,
      badgeColor: "bg-green-100 text-green-700",
      content: (() => {
        const realizadas = SOLICITUDES.filter((s) => s.estado === "Finalizada");
        return realizadas.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Sin actividades finalizadas.</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {realizadas.map((s) => (
              <div key={s.id} className="flex items-start gap-2.5 bg-green-50 rounded-lg px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{s.actividad}</p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(s.fechaActividad + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" })}
                    {s.lugar ? ` · ${s.lugar}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );
      })(),
    },
    {
      id: "personal",
      label: "Personal asignado",
      icon: IconUsers,
      description: "Participación del personal en solicitudes como responsable o apoyo.",
      badge: `${USUARIOS.filter((u) => u.estado !== "Inactivo").length} activos`,
      badgeColor: "bg-purple-100 text-purple-700",
      content: (
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {personalCounts.map(({ usuario: u, total }, i) => {
            if (!u) return null;
            const pct = Math.round((total / (personalCounts[0]?.total ?? 1)) * 100);
            return (
              <div key={u.id} className="flex items-center gap-2.5">
                <span className="text-[10px] text-slate-400 w-4 text-right shrink-0">{i + 1}</span>
                <div className="w-6 h-6 rounded-full bg-navy text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                  {u.primerNombre[0]}{u.primerApellido[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{getNombreCompleto(u)}</p>
                  <div className="mt-0.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-navy transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-600 shrink-0 w-5 text-right">{total}</span>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      id: "solicitante",
      label: "Solicitudes por solicitante",
      icon: IconPeople,
      description: "Ranking de dependencias y entidades que han generado más solicitudes de cobertura.",
      badge: `${solicitanteCounts.length} entidades`,
      badgeColor: "bg-amber-100 text-amber-700",
      content: (
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {solicitanteCounts.map(({ nombre, dep, count }, i) => {
            const pct = Math.round((count / (solicitanteCounts[0]?.count ?? 1)) * 100);
            return (
              <div key={nombre} className="flex items-center gap-2.5">
                <span className="text-[10px] text-slate-400 w-4 text-right shrink-0">{i + 1}</span>
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                  {nombre.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{nombre.split(" ").slice(-2).join(" ")}</p>
                  <p className="text-[10px] text-slate-400 truncate">{dep}</p>
                  <div className="mt-0.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-600 shrink-0 w-5 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      id: "prioridad",
      label: "Distribución por prioridad",
      icon: IconSearch,
      description: "Cantidad de solicitudes clasificadas por nivel de prioridad: Normal, Media y Alta.",
      content: (() => {
        const prios = (["Normal", "Media", "Alta"] as const).map((p) => ({
          label: p,
          count: SOLICITUDES.filter((s) => s.prioridad === p).length,
          c: PRIORIDAD_COLORS[p],
        }));
        const maxP = Math.max(...prios.map((x) => x.count), 1);
        return (
          <div className="space-y-3">
            {prios.map(({ label, count, c }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`text-xs font-semibold w-14 text-right shrink-0 ${c.text}`}>{label}</span>
                <div className="flex-1 h-5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${c.bg.replace("bg-", "bg-")} transition-all duration-700`}
                    style={{ width: `${Math.round((count / maxP) * 100)}%`, background: label === "Alta" ? "#ef4444" : label === "Media" ? "#f59e0b" : "#94a3b8" }} />
                </div>
                <span className="text-sm font-bold text-slate-700 w-5 text-right shrink-0">{count}</span>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              {prios.map(({ label, count, c }) => (
                <div key={label} className={`flex-1 rounded-lg p-2.5 text-center ${c.bg}`}>
                  <p className={`text-lg font-bold ${c.text}`}>{count}</p>
                  <p className={`text-[10px] font-semibold ${c.text} opacity-70`}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })(),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900 text-lg">Reportes</h2>
        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center gap-2 bg-navy text-white text-sm font-semibold px-4 py-2 rounded-lg btn-primary"
        >
          <IconDownload className="w-4 h-4" /> Generar reporte PDF
        </button>
      </div>

      {/* ── KPI strip ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className={`text-3xl font-bold ${s.text} mb-1`}>{s.value}</div>
            <p className="text-xs text-slate-500 font-medium leading-tight">{s.label}</p>
            <div className={`mt-3 h-1.5 w-full rounded-full ${s.light}`}>
              <div
                className={`h-1.5 rounded-full ${s.color} transition-all duration-500`}
                style={{ width: `${SOLICITUDES.length > 0 ? Math.round((s.value / SOLICITUDES.length) * 100) : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Two-column layout ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Accordion */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">Tipos de reporte</p>
          <Accordion items={acordeonItems} />
        </div>

        {/* Right: Live chart + filtered table */}
        <div className="lg:col-span-2 space-y-5">

          {/* Bar chart — always visible */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-slate-900">Solicitudes por estado</p>
              <span className="text-xs text-slate-400">{SOLICITUDES.length} solicitudes</span>
            </div>
            <div className="space-y-3">
              {countByEstado.map(({ estado, count }) => {
                const c   = ESTADO_COLORS[estado];
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={estado} className="flex items-center gap-3">
                    <div className="w-28 shrink-0 flex items-center gap-1.5 justify-end">
                      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                      <span className={`text-xs font-medium ${c.text}`}>{estado}</span>
                    </div>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c.dot} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-5 text-right shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filtered results table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <p className="font-semibold text-slate-900 text-sm">
                Resultados del período
                {filterEstado !== "Todos" && (
                  <span className="ml-2 text-xs font-medium text-slate-400">· {filterEstado}</span>
                )}
              </p>
              <span className="text-xs text-slate-400 font-semibold">{filtered.length} registro(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["Código", "Actividad", "Fecha", "Prioridad", "Estado"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">
                        Sin registros en el período seleccionado.
                      </td>
                    </tr>
                  ) : filtered.map((s) => {
                    const c  = ESTADO_COLORS[s.estado];
                    const pc = PRIORIDAD_COLORS[s.prioridad];
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-400 font-semibold whitespace-nowrap">{s.codigo}</td>
                        <td className="px-4 py-2.5 text-xs font-medium text-slate-800 max-w-[180px]">
                          <p className="truncate">{s.actividad}</p>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(s.fechaActividad + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-4 py-2.5">
                          {s.prioridad !== "Normal" && (
                            <Badge label={s.prioridad} bg={pc.bg} text={pc.text} size="xs" />
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge label={s.estado} bg={c.bg} text={c.text} dot={c.dot} size="xs" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── PDF Preview modal ──────────────────────────────── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Vista previa del reporte</h3>
              <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-slate-700 text-sm font-medium">
                Cerrar
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
              <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm space-y-6">
                <div className="border-b-2 border-navy pb-4">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Municipalidad de Santiago Atitlán, Sololá</p>
                  <h2 className="text-xl font-bold text-navy mt-1">Dirección de Comunicación Social</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Reporte de Gestión Operativa</p>
                  <p className="text-xs text-slate-400 mt-2">
                    Período:{" "}
                    {new Date(dateFrom + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" })} al{" "}
                    {new Date(dateTo   + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className="text-xs text-slate-400">Generado el: 5 de septiembre de 2026</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-3">Resumen ejecutivo</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Total solicitudes", value: filtered.length },
                      { label: "Finalizadas",        value: filtered.filter((s) => s.estado === "Finalizada").length },
                      { label: "Pendientes",          value: filtered.filter((s) => s.estado === "Pendiente").length },
                    ].map((item) => (
                      <div key={item.label} className="text-center bg-slate-50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-navy">{item.value}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-3">Detalle de solicitudes</p>
                  <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-navy text-white">
                      <tr>
                        {["Código", "Actividad", "Fecha", "Lugar", "Estado"].map((h) => (
                          <th key={h} className="text-left px-3 py-2 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((s, idx) => (
                        <tr key={s.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-3 py-2 font-mono text-slate-500">{s.codigo}</td>
                          <td className="px-3 py-2 font-medium text-slate-800 max-w-[160px] truncate">{s.actividad}</td>
                          <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                            {new Date(s.fechaActividad + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "short" })}
                          </td>
                          <td className="px-3 py-2 text-slate-500 max-w-[120px] truncate">{s.lugar}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ESTADO_COLORS[s.estado].bg} ${ESTADO_COLORS[s.estado].text}`}>
                              {s.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-slate-200 pt-4 text-center">
                  <p className="text-[10px] text-slate-400">Sistema Web de Gestión Operativa · Municipalidad de Santiago Atitlán, Sololá, Guatemala</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
              <button className="flex items-center gap-2 bg-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg btn-primary">
                <IconDownload className="w-4 h-4" /> Descargar PDF
              </button>
              <button onClick={() => setShowPreview(false)} className="text-sm text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-100">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
