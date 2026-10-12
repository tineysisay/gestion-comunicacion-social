import { useState } from "react";
import {
  KANBAN_COLUMNS, ESTADO_COLORS, PRIORIDAD_COLORS,
  getUsuarioById, getNombreCompleto,
  type Solicitud, type SolicitudEstado, type SolicitudPrioridad
} from "../data/mockData";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Badge from "../components/Badge";
import {
  IconPlus, IconSearch, IconClock, IconMapPin, IconCalendar,
  IconUser, IconEdit, IconTrash, IconCheck, IconRefresh
} from "../components/Icons";

const EMPTY_FORM = {
  solicitanteId: "",
  actividad: "",
  fechaActividad: "",
  horaInicio: "",
  horaFin: "",
  lugar: "",
  descripcion: "",
  prioridad: "Normal" as SolicitudPrioridad,
  responsableId: "",
  asignadosIds: [] as string[],
};

export default function Kanban() {
  const { solicitudes, addSolicitud, updateSolicitud, deleteSolicitud, solicitantes, usuarios, changeSolicitudEstado } = useApp();
  const { can, isLector } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [detailModal, setDetailModal] = useState<Solicitud | null>(null);
  const [editModal, setEditModal] = useState<Solicitud | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Solicitud | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);

  const filtered = search
    ? solicitudes.filter(
        (s) =>
          s.actividad.toLowerCase().includes(search.toLowerCase()) ||
          s.codigo.toLowerCase().includes(search.toLowerCase())
      )
    : solicitudes;

  const byEstado = (estado: SolicitudEstado) => filtered.filter((s) => s.estado === estado);

  const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" });

  const openEdit = (s: Solicitud) => {
    setEditModal(s);
    setForm({
      solicitanteId: s.solicitanteId,
      actividad: s.actividad,
      fechaActividad: s.fechaActividad,
      horaInicio: s.horaInicio,
      horaFin: s.horaFin,
      lugar: s.lugar,
      descripcion: s.descripcion,
      prioridad: s.prioridad,
      responsableId: s.responsableId ?? "",
      asignadosIds: s.asignados ?? [],
    });
  };

  const handleCreate = () => {
    if (!form.solicitanteId || !form.actividad || !form.fechaActividad) return;
    setFormLoading(true);
    setTimeout(() => {
      const now = new Date().toISOString().split("T")[0];
      const { responsableId, asignadosIds, ...rest } = form;
      addSolicitud({
        id: `req${Date.now()}`,
        codigo: `SOL-2026-${String(solicitudes.length + 1).padStart(3, "0")}`,
        estado: "Pendiente",
        asignados: asignadosIds,
        recursos: [],
        responsableId: responsableId || undefined,
        createdAt: now,
        updatedAt: now,
        ...rest,
      });
      setFormLoading(false);
      setCreateOpen(false);
      toast.success("Solicitud creada", `"${form.actividad}" fue agregada al tablero.`);
    }, 600);
  };

  const handleEdit = () => {
    if (!editModal) return;
    setFormLoading(true);
    setTimeout(() => {
      const { responsableId, asignadosIds, ...rest } = form;
      const updated = { ...editModal, ...rest, responsableId: responsableId || undefined, asignados: asignadosIds, updatedAt: new Date().toISOString().split("T")[0] };
      updateSolicitud(updated);
      if (detailModal?.id === editModal.id) setDetailModal(updated);
      setFormLoading(false);
      setEditModal(null);
      toast.success("Solicitud actualizada", "Los cambios fueron guardados.");
    }, 600);
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteSolicitud(confirmDelete.id);
    setDetailModal(null);
    setConfirmDelete(null);
    toast.error("Solicitud eliminada", `"${confirmDelete.actividad}" fue eliminada del tablero.`);
  };

  const handleChangeEstado = (id: string, newEstado: SolicitudEstado, currentEstado: SolicitudEstado) => {
    if (newEstado === currentEstado) return;
    changeSolicitudEstado(id, newEstado);
    if (detailModal?.id === id) setDetailModal((s) => s ? { ...s, estado: newEstado } : s);
    toast.success("Estado actualizado", `Solicitud cambiada a "${newEstado}".`);
  };

  const canSave = form.solicitanteId && form.actividad && form.fechaActividad;

  const COLUMN_STYLE: Record<SolicitudEstado, string> = {
    Pendiente:      "bg-amber-50 border-amber-200",
    "En proceso":   "bg-blue-50 border-blue-200",
    Programada:     "bg-purple-50 border-purple-200",
    "En ejecución": "bg-orange-50 border-orange-200",
    Finalizada:     "bg-green-50 border-green-200",
  };

  const inp = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20";
  const activeUsers = usuarios.filter((u) => u.estado !== "Inactivo" && u.estado !== "Bloqueado");

  const formBody = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Solicitante *</label>
        <select value={form.solicitanteId} onChange={(e) => setForm({ ...form, solicitanteId: e.target.value })}
          className={`${inp} bg-white`}>
          <option value="">Seleccionar solicitante...</option>
          {solicitantes.map((s) => <option key={s.id} value={s.id}>{s.nombre} — {s.dependencia}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de la actividad *</label>
        <input value={form.actividad} onChange={(e) => setForm({ ...form, actividad: e.target.value })}
          placeholder="Ej. Inauguración Parque Municipal" className={inp} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha *</label>
          <input type="date" value={form.fechaActividad} onChange={(e) => setForm({ ...form, fechaActividad: e.target.value })} className={inp} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Hora inicio</label>
          <input type="time" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} className={inp} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Hora fin</label>
          <input type="time" value={form.horaFin} onChange={(e) => setForm({ ...form, horaFin: e.target.value })} className={inp} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Lugar</label>
        <input value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })}
          placeholder="Ej. Parque Central, Santiago Atitlán" className={inp} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Prioridad</label>
        <div className="flex gap-2">
          {(["Normal", "Media", "Alta"] as SolicitudPrioridad[]).map((p) => (
            <button key={p} type="button" onClick={() => setForm({ ...form, prioridad: p })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all
                ${form.prioridad === p
                  ? p === "Alta" ? "bg-red-100 text-red-700 border-red-300"
                    : p === "Media" ? "bg-amber-100 text-amber-700 border-amber-300"
                    : "bg-slate-200 text-slate-700 border-slate-300"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                }`}
            >{p}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción</label>
        <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value.slice(0, 1000) })}
          rows={3} placeholder="Describa los requerimientos de cobertura..."
          className={`${inp} resize-none`} />
        <p className="text-xs text-slate-400 mt-1 text-right">{form.descripcion.length}/1000</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Asignación de personal</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Responsable a cargo</label>
            <select value={form.responsableId} onChange={(e) => setForm({ ...form, responsableId: e.target.value })}
              className={`${inp} bg-white`}>
              <option value="">Sin responsable asignado</option>
              {activeUsers.map((u) => (
                <option key={u.id} value={u.id}>{getNombreCompleto(u)} — {u.cargo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Personal de apoyo</label>
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
              {activeUsers.map((u) => {
                const checked = form.asignadosIds.includes(u.id);
                return (
                  <label key={u.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0">
                    <input type="checkbox" checked={checked}
                      onChange={() => {
                        const next = checked ? form.asignadosIds.filter((id) => id !== u.id) : [...form.asignadosIds, u.id];
                        setForm({ ...form, asignadosIds: next });
                      }}
                      className="w-4 h-4 rounded border-slate-300 accent-navy" />
                    <div className="w-6 h-6 rounded-full bg-navy text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {u.primerNombre[0]}{u.primerApellido[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800 font-medium truncate">{getNombreCompleto(u)}</p>
                      <p className="text-xs text-slate-400 truncate">{u.cargo}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            {form.asignadosIds.length > 0 && (
              <p className="text-xs text-navy font-semibold mt-1.5">{form.asignadosIds.length} seleccionado(s)</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4 shrink-0">
        <h2 className="font-bold text-slate-900 text-lg">Tablero Kanban</h2>
        <div className="flex-1" />
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar solicitud..."
            className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 bg-slate-50 w-56" />
        </div>
        {can("create") && (
          <button onClick={() => { setForm(EMPTY_FORM); setCreateOpen(true); }}
            className="flex items-center gap-2 bg-navy text-white text-sm font-medium px-4 py-2 rounded-lg btn-primary">
            <IconPlus className="w-4 h-4" /> Nueva solicitud
          </button>
        )}
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-5">
        <div className="flex gap-4 h-full min-w-max">
          {KANBAN_COLUMNS.map((estado) => {
            const cards = byEstado(estado);
            const colors = ESTADO_COLORS[estado];
            return (
              <div key={estado} className={`flex flex-col w-64 rounded-xl border ${COLUMN_STYLE[estado]} shrink-0`}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-current/10">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                    <span className={`text-sm font-semibold ${colors.text}`}>{estado}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{cards.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {cards.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-slate-400">
                      <p className="text-xs">Sin solicitudes</p>
                    </div>
                  )}
                  {cards.map((s) => {
                    const sol = solicitantes.find((x) => x.id === s.solicitanteId);
                    const pc = PRIORIDAD_COLORS[s.prioridad];
                    return (
                      <div key={s.id} onClick={() => setDetailModal(s)}
                        className="kanban-card bg-white rounded-lg border border-slate-200 p-3 shadow-sm cursor-pointer">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">{s.codigo}</span>
                          {s.prioridad !== "Normal" && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${pc.bg} ${pc.text}`}>{s.prioridad}</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-slate-800 leading-snug mb-2">{s.actividad}</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <IconCalendar className="w-3 h-3 shrink-0" />
                            <span>{formatDate(s.fechaActividad)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <IconClock className="w-3 h-3 shrink-0" />
                            <span>{s.horaInicio} – {s.horaFin}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <IconMapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{s.lugar}</span>
                          </div>
                        </div>
                        {sol && (
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                              {sol.nombre.charAt(0)}
                            </div>
                            <span className="text-[10px] text-slate-500 truncate">{sol.nombre.split(" ").slice(-2).join(" ")}</span>
                          </div>
                        )}
                        {s.asignados.length > 0 && (
                          <div className="mt-1.5 flex items-center gap-1">
                            <span className="text-[10px] text-slate-400">Asignados:</span>
                            <div className="flex -space-x-1">
                              {s.asignados.slice(0, 3).map((uid) => {
                                const u = getUsuarioById(uid);
                                return u ? (
                                  <div key={uid} title={getNombreCompleto(u)}
                                    className="w-5 h-5 rounded-full bg-navy text-white text-[8px] font-bold flex items-center justify-center border border-white">
                                    {u.primerNombre[0]}{u.primerApellido[0]}
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CREATE */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nueva solicitud de cobertura"
        subtitle="La solicitud se agregará como Pendiente."
        footer={
          <>
            <button onClick={handleCreate} disabled={!canSave || formLoading}
              className="flex items-center gap-2 bg-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg btn-primary disabled:opacity-50">
              {formLoading ? <IconRefresh className="w-4 h-4 animate-spin" /> : <IconCheck className="w-4 h-4" />}
              {formLoading ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={() => setCreateOpen(false)} className="text-sm text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-100">Cancelar</button>
          </>
        }
      >
        {formBody}
      </Modal>

      {/* EDIT */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Editar solicitud"
        subtitle={editModal?.codigo}
        footer={
          <>
            <button onClick={handleEdit} disabled={!canSave || formLoading}
              className="flex items-center gap-2 bg-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg btn-primary disabled:opacity-50">
              {formLoading ? <IconRefresh className="w-4 h-4 animate-spin" /> : <IconCheck className="w-4 h-4" />}
              {formLoading ? "Guardando..." : "Guardar cambios"}
            </button>
            <button onClick={() => setEditModal(null)} className="text-sm text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-100">Cancelar</button>
          </>
        }
      >
        {formBody}
      </Modal>

      {/* DETAIL */}
      {detailModal && (() => {
        const s = detailModal;
        const sol = solicitantes.find((x) => x.id === s.solicitanteId);
        const c = ESTADO_COLORS[s.estado];
        return (
          <Modal open onClose={() => setDetailModal(null)} title={s.actividad} subtitle={s.codigo} size="lg"
            footer={
              <>
                {can("edit") && (
                  <button onClick={() => { openEdit(s); setDetailModal(null); }} className="flex items-center gap-2 bg-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg btn-primary">
                    <IconEdit className="w-4 h-4" /> Editar
                  </button>
                )}
                {can("delete") && (
                  <button onClick={() => { setConfirmDelete(s); setDetailModal(null); }} className="flex items-center gap-2 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-red-50">
                    <IconTrash className="w-4 h-4" /> Eliminar
                  </button>
                )}
                <button onClick={() => setDetailModal(null)} className="ml-auto text-sm text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-100">Cerrar</button>
              </>
            }
          >
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge label={s.estado} bg={c.bg} text={c.text} dot={c.dot} />
                <Badge label={`Prioridad: ${s.prioridad}`} bg={PRIORIDAD_COLORS[s.prioridad].bg} text={PRIORIDAD_COLORS[s.prioridad].text} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: IconCalendar, label: "Fecha", value: formatDate(s.fechaActividad) },
                  { icon: IconClock, label: "Horario", value: `${s.horaInicio} – ${s.horaFin}` },
                  { icon: IconMapPin, label: "Lugar", value: s.lugar || "—" },
                  { icon: IconUser, label: "Solicitante", value: sol?.nombre ?? "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{label}</span>
                    </div>
                    <p className="text-sm text-slate-800 font-medium leading-snug">{value}</p>
                  </div>
                ))}
              </div>

              {s.descripcion && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Descripción</p>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-4">{s.descripcion}</p>
                </div>
              )}

              {can("changeEstado") && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Mover a estado</p>
                  <div className="flex flex-wrap gap-2">
                    {KANBAN_COLUMNS.map((estado) => {
                      const cc = ESTADO_COLORS[estado];
                      const isActive = s.estado === estado;
                      return (
                        <button key={estado}
                          onClick={() => handleChangeEstado(s.id, estado, s.estado)}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all
                            ${isActive ? `${cc.bg} ${cc.text} border-current font-bold` : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"}`}
                        >
                          {estado}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="¿Eliminar solicitud?" variant="danger" confirmLabel="Sí, eliminar"
        message={`La solicitud "${confirmDelete?.actividad}" será eliminada permanentemente. Esta acción no se puede deshacer.`} />
    </div>
  );
}
