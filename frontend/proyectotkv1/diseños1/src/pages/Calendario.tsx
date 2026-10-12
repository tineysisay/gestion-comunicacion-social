import { useState } from "react";
import { ESTADO_COLORS, getSolicitanteById, PRIORIDAD_COLORS, type Solicitud } from "../data/mockData";
import { useApp } from "../context/AppContext";
import Badge from "../components/Badge";
import {
  IconChevronLeft, IconChevronRight, IconClose,
  IconClock, IconMapPin, IconUser, IconCalendar
} from "../components/Icons";

type CalView = "mensual" | "semanal" | "diaria";

const DAYS_ES   = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAYS_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Returns 42-cell grid for a month calendar
function getCalendarDays(year: number, month: number) {
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const days: { date: number; month: "prev" | "current" | "next"; full: string }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    days.push({ date: d, month: "prev", full: toISO(y, m + 1, d) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: d, month: "current", full: toISO(year, month + 1, d) });
  }
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    days.push({ date: d, month: "next", full: toISO(y, m + 1, d) });
  }
  return days;
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateToISO(d: Date) {
  return toISO(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfWeek(d: Date) {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00–20:00

export default function Calendario() {
  const { solicitudes: SOLICITUDES } = useApp();
  const today = new Date();
  const todayISO = dateToISO(today);

  const [calView, setCalView] = useState<CalView>("mensual");
  const [cursor, setCursor] = useState<Date>(new Date(today));

  const year  = cursor.getFullYear();
  const month = cursor.getMonth();

  // ── Navigation ────────────────────────────────────────────────
  const navigate = (dir: -1 | 1) => {
    setCursor((prev) => {
      const d = new Date(prev);
      if (calView === "mensual") {
        d.setMonth(d.getMonth() + dir);
        d.setDate(1);
      } else if (calView === "semanal") {
        d.setDate(d.getDate() + dir * 7);
      } else {
        d.setDate(d.getDate() + dir);
      }
      return d;
    });
  };

  const goToday = () => setCursor(new Date(today));

  // ── Label for toolbar ─────────────────────────────────────────
  const toolbarLabel = (() => {
    if (calView === "mensual") return `${MONTHS_ES[month]} ${year}`;
    if (calView === "semanal") {
      const ws = startOfWeek(cursor);
      const we = addDays(ws, 6);
      const sameMonth = ws.getMonth() === we.getMonth();
      if (sameMonth) return `${ws.getDate()} – ${we.getDate()} de ${MONTHS_ES[ws.getMonth()]} ${ws.getFullYear()}`;
      return `${ws.getDate()} ${MONTHS_SHORT[ws.getMonth()]} – ${we.getDate()} ${MONTHS_SHORT[we.getMonth()]} ${we.getFullYear()}`;
    }
    // diaria
    return cursor.toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  })();

  // ── Data helpers ──────────────────────────────────────────────
  const getSolicitudesForDay = (dateStr: string) =>
    SOLICITUDES.filter((s) => s.fechaActividad === dateStr);

  const getWeekDates = () =>
    Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i));

  const [selected, setSelected] = useState<Solicitud | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 shrink-0 flex-wrap">

        {/* Prev / Label / Next */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
          >
            <IconChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-slate-900 text-sm sm:text-base min-w-[200px] text-center capitalize select-none">
            {toolbarLabel}
          </span>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
          >
            <IconChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Hoy */}
        <button
          onClick={goToday}
          className="text-sm text-navy font-semibold hover:bg-navy/5 px-3 py-1.5 rounded-lg transition-colors border border-navy/20"
        >
          Hoy
        </button>

        <div className="flex-1" />

        {/* View switcher */}
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {([
            { id: "diaria",   label: "Día" },
            { id: "semanal",  label: "Semana" },
            { id: "mensual",  label: "Mes" },
          ] as { id: CalView; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setCalView(id)}
              className={`text-sm px-4 py-1.5 rounded-md font-medium transition-all
                ${calView === id ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Calendar body ──────────────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-white">

        {/* ══ MENSUAL ══════════════════════════════════════════ */}
        {calView === "mensual" && (() => {
          const calDays = getCalendarDays(year, month);
          return (
            <div className="min-h-full flex flex-col">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-slate-200 sticky top-0 bg-white z-10">
                {DAYS_ES.map((d) => (
                  <div key={d} className="px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-100 last:border-r-0 text-center">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 flex-1">
                {calDays.map((day, idx) => {
                  const dayEvents  = getSolicitudesForDay(day.full);
                  const isToday    = day.full === todayISO;
                  const isOtherMo  = day.month !== "current";
                  const isCursor   = day.full === dateToISO(cursor);
                  return (
                    <div
                      key={idx}
                      onClick={() => { setCursor(new Date(day.full + "T12:00:00")); }}
                      className={`min-h-[110px] p-2 border-b border-r border-slate-100 last:border-r-0 cursor-pointer transition-colors
                        ${isOtherMo ? "bg-slate-50/60" : isCursor ? "bg-navy/3" : "bg-white hover:bg-slate-50/50"}`}
                    >
                      <div className="flex items-center justify-center mb-1.5">
                        <span
                          className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-colors
                            ${isToday ? "bg-navy text-white" : isOtherMo ? "text-slate-300" : "text-slate-700"}`}
                        >
                          {day.date}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((s) => {
                          const c = ESTADO_COLORS[s.estado];
                          return (
                            <button
                              key={s.id}
                              onClick={(e) => { e.stopPropagation(); setSelected(s); }}
                              className={`w-full text-left text-[10px] font-medium px-1.5 py-1 rounded truncate ${c.bg} ${c.text} hover:opacity-80 transition-opacity`}
                            >
                              {s.horaInicio && `${s.horaInicio} `}{s.actividad}
                            </button>
                          );
                        })}
                        {dayEvents.length > 2 && (
                          <p className="text-[10px] text-slate-400 px-1 font-medium">+{dayEvents.length - 2} más</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ══ SEMANAL ══════════════════════════════════════════ */}
        {calView === "semanal" && (() => {
          const weekDates = getWeekDates();
          return (
            <div className="flex flex-col min-h-full">
              {/* Week header */}
              <div className="grid grid-cols-8 border-b border-slate-200 sticky top-0 bg-white z-10">
                <div className="p-3 text-xs text-slate-400 font-semibold text-center">Hora</div>
                {weekDates.map((d, i) => {
                  const isT    = d.toDateString() === today.toDateString();
                  const dISO   = dateToISO(d);
                  const events = getSolicitudesForDay(dISO);
                  return (
                    <div
                      key={i}
                      onClick={() => { setCursor(new Date(d)); setCalView("diaria"); }}
                      className={`p-3 text-center border-l border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors
                        ${isT ? "bg-navy/5" : ""}`}
                    >
                      <p className="text-xs text-slate-500 uppercase tracking-wide">{DAYS_ES[d.getDay()]}</p>
                      <p className={`text-xl font-bold mt-0.5 ${isT ? "text-navy" : "text-slate-800"}`}>{d.getDate()}</p>
                      {events.length > 0 && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 inline-block
                          ${isT ? "bg-navy text-white" : "bg-slate-200 text-slate-600"}`}>
                          {events.length}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Time grid */}
              <div className="flex-1 overflow-auto">
                {HOURS.map((h) => (
                  <div key={h} className="grid grid-cols-8 border-b border-slate-100 min-h-[56px]">
                    <div className="px-3 py-2 text-right text-xs text-slate-400 font-medium border-r border-slate-100 select-none">
                      {h.toString().padStart(2, "0")}:00
                    </div>
                    {weekDates.map((d, di) => {
                      const dISO   = dateToISO(d);
                      const isT    = d.toDateString() === today.toDateString();
                      const events = SOLICITUDES.filter((s) => {
                        const startH = parseInt(s.horaInicio?.split(":")[0] ?? "0");
                        return s.fechaActividad === dISO && startH === h;
                      });
                      return (
                        <div key={di} className={`border-l border-slate-100 p-1 relative ${isT ? "bg-navy/2" : ""}`}>
                          {events.map((s) => {
                            const c = ESTADO_COLORS[s.estado];
                            return (
                              <button
                                key={s.id}
                                onClick={() => setSelected(s)}
                                className={`w-full text-left text-[10px] px-1.5 py-1 rounded font-medium ${c.bg} ${c.text} hover:opacity-80 transition-opacity truncate mb-0.5`}
                              >
                                {s.actividad}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ══ DIARIA ═══════════════════════════════════════════ */}
        {calView === "diaria" && (() => {
          const dayISO    = dateToISO(cursor);
          const isToday   = dayISO === todayISO;
          const dayEvents = getSolicitudesForDay(dayISO);
          const dayLabel  = cursor.toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
          return (
            <div className="flex flex-col min-h-full">
              {/* Day header */}
              <div className={`px-6 py-4 border-b border-slate-100 flex items-center gap-4 ${isToday ? "bg-navy/5" : ""}`}>
                <div>
                  <p className={`text-lg font-bold capitalize ${isToday ? "text-navy" : "text-slate-900"}`}>{dayLabel}</p>
                  {isToday && <p className="text-xs text-navy/70 font-semibold">Hoy</p>}
                </div>
                {dayEvents.length > 0 && (
                  <span className="ml-auto text-xs font-semibold bg-navy text-white px-2.5 py-1 rounded-full">
                    {dayEvents.length} actividad{dayEvents.length !== 1 ? "es" : ""}
                  </span>
                )}
              </div>
              {/* Time slots */}
              <div className="flex-1 overflow-auto">
                {HOURS.map((h) => {
                  const events = SOLICITUDES.filter((s) => {
                    const startH = parseInt(s.horaInicio?.split(":")[0] ?? "0");
                    return s.fechaActividad === dayISO && startH === h;
                  });
                  const isCurrentHour = isToday && new Date().getHours() === h;
                  return (
                    <div key={h} className={`flex border-b border-slate-100 min-h-[64px] ${isCurrentHour ? "bg-navy/3" : ""}`}>
                      <div className="w-20 shrink-0 px-4 py-3 text-right border-r border-slate-100">
                        <span className={`text-xs font-semibold ${isCurrentHour ? "text-navy" : "text-slate-400"}`}>
                          {h.toString().padStart(2, "0")}:00
                        </span>
                        {isCurrentHour && (
                          <div className="mt-1 flex justify-end">
                            <span className="w-2 h-2 rounded-full bg-navy animate-pulse" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-2 space-y-1.5">
                        {events.map((s) => {
                          const c  = ESTADO_COLORS[s.estado];
                          const pc = PRIORIDAD_COLORS[s.prioridad];
                          return (
                            <button
                              key={s.id}
                              onClick={() => setSelected(s)}
                              className={`w-full text-left px-4 py-3 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all group
                                ${c.bg} border-current`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm font-bold ${c.text} leading-snug`}>{s.actividad}</p>
                                {s.prioridad !== "Normal" && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${pc.bg} ${pc.text}`}>
                                    {s.prioridad}
                                  </span>
                                )}
                              </div>
                              <p className={`text-xs mt-1 opacity-70 ${c.text}`}>
                                {s.horaInicio} – {s.horaFin}{s.lugar ? ` · ${s.lugar}` : ""}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {dayEvents.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <IconCalendar className="w-10 h-10 opacity-20 mb-3" />
                    <p className="text-sm font-medium">Sin actividades este día</p>
                    <p className="text-xs mt-1 opacity-70">
                      {isToday ? "No hay actividades programadas para hoy" : "Usa las flechas para navegar a otro día"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Event detail popover ────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-slate-100">
              <div className="flex-1 min-w-0 pr-4">
                <Badge
                  label={selected.estado}
                  bg={ESTADO_COLORS[selected.estado].bg}
                  text={ESTADO_COLORS[selected.estado].text}
                  dot={ESTADO_COLORS[selected.estado].dot}
                />
                <h3 className="text-base font-bold text-slate-900 mt-2 leading-snug">{selected.actividad}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selected.codigo}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              >
                <IconClose className="w-5 h-5" />
              </button>
            </div>
            {/* Body */}
            <div className="p-5 space-y-3">
              {[
                {
                  icon: IconClock,
                  value: `${new Date(selected.fechaActividad + "T12:00:00").toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long" })} · ${selected.horaInicio}–${selected.horaFin}`,
                },
                { icon: IconMapPin, value: selected.lugar || "Sin lugar registrado" },
                { icon: IconUser, value: getSolicitanteById(selected.solicitanteId)?.nombre ?? "—" },
              ].map(({ icon: Icon, value }, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span className="capitalize">{value}</span>
                </div>
              ))}
              {selected.descripcion && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Descripción</p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {selected.descripcion.slice(0, 220)}{selected.descripcion.length > 220 ? "…" : ""}
                  </p>
                </div>
              )}
            </div>
            <div className="px-5 pb-5">
              <button
                onClick={() => setSelected(null)}
                className="text-sm text-slate-500 hover:text-slate-800 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
