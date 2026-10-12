import { useState } from "react";
import {
  ESTADO_COLORS, PRIORIDAD_COLORS, KANBAN_COLUMNS,
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
  IconPlus, IconSearch, IconEye, IconEdit, IconTrash,
  IconClock, IconMapPin, IconCalendar, IconUser, IconDocument,
  IconCheck, IconRefresh
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

// Shared select/input classes
const input = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40";
const select = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white";

export default function Solicitudes() {
  const { solicitudes, addSolicitud, updateSolicitud, deleteSolicitud, solicitantes, usuarios, changeSolicitudEstado } = useApp();
  const { can, isLector } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("Todos");

  const [detailModal, setDetailModal] = useState<Solicitud | null>(null);
  const [editModal, setEditModal] = useState<Solicitud | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Solicitud | null>(null);
  const [confirmEstado, setConfirmEstado] = useState<{ sol: Solicitud; newEstado: SolicitudEstado } | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);

  const set = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));
  const toggleAsignado = (uid: string) =>
    setForm((prev) => ({
      ...prev,
      asignadosIds: prev.asignadosIds.includes(uid)
        ? prev.asignadosIds.filter((id) => id !== uid)
        : [...prev.asignadosIds, uid],
    }));

  const filtered = solicitudes.filter((s) => {
    const sol = solicitantes.find((x) => x.id === s.solicitanteId);
    const q = search.toLowerCase();
    const matchS = !search ||
      s.actividad.toLowerCase().includes(q) ||
      s.codigo.toLowerCase().includes(q) ||
      (sol?.nombre.toLowerCase().includes(q) ?? false);
    const matchE = filterEstado === "Todos" || s.estado === filterEstado;
    return matchS && matchE;
  });

  const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" });

  const openCreate = () => { setForm(EMPTY_FORM); setCreateOpen(true); };

  const openEdit = (s: Solicitud) => {
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
    setEditModal(s);
  };

  const commit = (isNew: boolean) => {
    setFormLoading(true);
    const { responsableId, asignadosIds, ...rest } = form;
    setTimeout(() => {
      if (isNew) {
        const now = new Date().toISOString().split("T")[0];
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
        setCreateOpen(false);
        toast.success("Solicitud registrada", `"${form.actividad}" fue agregada correctamente.`);
      } else if (editModal) {
        const updated: Solicitud = {
          ...editModal,
          ...rest,
          responsableId: responsableId || undefined,
          asignados: asignadosIds,
          updatedAt: new Date().toISOString().split("T")[0],
        };
        updateSolicitud(updated);
        if (detailModal?.id === editModal.id) setDetailModal(updated);
        setEditModal(null);
        toast.success("Solicitud actualizada", "Los cambios fueron guardados.");
      }
      setFormLoading(false);
    }, 500);
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteSolicitud(confirmDelete.id);
    if (detailModal?.id === confirmDelete.id) setDetailModal(null);
    toast.error("Solicitud eliminada", `"${confirmDelete.actividad}" fue eliminada.`);
    setConfirmDelete(null);
  };

  const handleChangeEstado = () => {
    if (!confirmEstado) return;
    changeSolicitudEstado(confirmEstado.sol.id, confirmEstado.newEstado);
    if (detailModal?.id === confirmEstado.sol.id)
      setDetailModal((s) => s ? { ...s, estado: confirmEstado.newEstado } : s);
    toast.success("Estado actualizado", `Cambiado a "${confirmEstado.newEstado}".`);
    setConfirmEstado(null);
  };

  const canSave = form.solicitanteId && form.actividad && form.fechaActividad;
  const activeUsers = usuarios.filter((u) => u.estado !== "Inactivo" && u.estado !== "Bloqueado");

  // ─── Inlined form JSX (not a component, avoids remount-on-type bug) ───
  const formBody = (
    <div className="space-y-6">
      {/* Solicitante */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Solicitante</p>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Solicitante *</label>
          <select value={form.solicitanteId} onChange={(e) => set("solicitanteId", e.target.value)} className={select}>
            <option value="">Seleccionar solicitante...</option>
            {solicitantes.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre} — {s.dependencia}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Datos actividad */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Datos de la actividad</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de la actividad *</label>
            <input
              value={form.actividad}
              onChange={(e) => set("actividad", e.target.value)}
              placeholder="Ej. Inauguración Parque Municipal"
              className={input}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha *</label>
              <input type="date" value={form.fechaActividad} onChange={(e) => set("fechaActividad", e.target.value)} className={input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Hora inicio</label>
              <input type="time" value={form.horaInicio} onChange={(e) => set("horaInicio", e.target.value)} className={input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Hora fin</label>
              <input type="time" value={form.horaFin} onChange={(e) => set("horaFin", e.target.value)} className={input} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Lugar</label>
            <input
              value={form.lugar}
              onChange={(e) => set("lugar", e.target.value)}
              placeholder="Ej. Parque Central, Santiago Atitlán"
              className={input}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Prioridad</label>
            <div className="flex gap-2">
              {(["Normal", "Media", "Alta"] as SolicitudPrioridad[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("prioridad", p)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all
                    ${form.prioridad === p
                      ? p === "Alta" ? "bg-red-100 text-red-700 border-red-300"
                        : p === "Media" ? "bg-amber-100 text-amber-700 border-amber-300"
                        : "bg-slate-200 text-slate-700 border-slate-300"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Descripción <span className="text-slate-400 font-normal">(máx. 1000 car.)</span>
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => set("descripcion", e.target.value.slice(0, 1000))}
              rows={4}
              placeholder="Describa la actividad, requerimientos especiales, número de asistentes esperados..."
              className={`${input} resize-none`}
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{form.descripcion.length}/1000</p>
          </div>
        </div>
      </div>

      {/* Asignación */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Asignación de personal</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Responsable a cargo</label>
            <select value={form.responsableId} onChange={(e) => set("responsableId", e.target.value)} className={select}>
              <option value="">Sin responsable asignado</option>
              {activeUsers.map((u) => (
                <option key={u.id} value={u.id}>{getNombreCompleto(u)} — {u.cargo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Personal de apoyo</label>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              {activeUsers.map((u) => {
                const checked = form.asignadosIds.includes(u.id);
                return (
                  <label
                    key={u.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAsignado(u.id)}
                      className="w-4 h-4 rounded border-slate-300 accent-navy"
                    />
                    <div className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {u.primerNombre[0]}{u.primerApellido[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{getNombreCompleto(u)}</p>
                      <p className="text-xs text-slate-400">{u.cargo}</p>
                    </div>
                    <Badge
                      label={u.rol === "Administrador" ? "Admin" : u.rol === "Director de dependencia" ? "Director" : "Lector"}
                      bg={checked ? "bg-navy/10" : "bg-slate-100"}
                      text={checked ? "text-navy" : "text-slate-500"}
                      size="xs"
                    />
                  </label>
                );
              })}
            </div>
            {form.asignadosIds.length > 0 && (
              <p className="text-xs text-navy font-semibold mt-1.5">
                {form.asignadosIds.length} persona(s) seleccionada(s)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const formFooter = (isNew: boolean) => (
    <>
      <button
        onClick={() => commit(isNew)}
        disabled={!canSave || formLoading}
        className="flex items-center gap-2 bg-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {formLoading ? <IconRefresh className="w-4 h-4 animate-spin" /> : <IconCheck className="w-4 h-4" />}
        {formLoading ? "Guardando..." : isNew ? "Guardar solicitud" : "Guardar cambios"}
      </button>
      <button
        onClick={() => isNew ? setCreateOpen(false) : setEditModal(null)}
        className="text-sm text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
      >
        Cancelar
      </button>
    </>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="font-bold text-slate-900 text-lg">Solicitudes</h2>
        <div className="flex-1" />
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por actividad, código o solicitante..."
            className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white w-72"
          />
        </div>
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white"
        >
          <option value="Todos">Todos los estados</option>
          {KANBAN_COLUMNS.map((e) => <option key={e}>{e}</option>)}
        </select>
        {can("create") && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-navy text-white text-sm font-semibold px-4 py-2 rounded-lg btn-primary"
          >
            <IconPlus className="w-4 h-4" /> Nueva solicitud
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-5 gap-2">
        {KANBAN_COLUMNS.map((estado) => {
          const c = ESTADO_COLORS[estado];
          const count = solicitudes.filter((s) => s.estado === estado).length;
          return (
            <button
              key={estado}
              onClick={() => setFilterEstado(filterEstado === estado ? "Todos" : estado)}
              className={`rounded-xl p-3 text-left border transition-all ${
                filterEstado === estado
                  ? `${c.bg} border-current/20 shadow-sm`
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${filterEstado === estado ? c.text : "text-slate-500"}`}>
                  {estado}
                </span>
              </div>
              <p className={`text-2xl font-bold ${filterEstado === estado ? c.text : "text-slate-800"}`}>{count}</p>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Código", "Actividad", "Solicitante", "Fecha", "Horario", "Lugar", "Estado", "Responsable", ...(isLector ? [] : ["Acciones"])].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                  <IconDocument className="w-9 h-9 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No se encontraron solicitudes.</p>
                  {search && <p className="text-xs mt-1 text-slate-400">Intente con otro término de búsqueda.</p>}
                </td>
              </tr>
            ) : (
              filtered.map((s) => {
                const sol = solicitantes.find((x) => x.id === s.solicitanteId);
                const resp = s.responsableId ? usuarios.find((u) => u.id === s.responsableId) : null;
                const c = ESTADO_COLORS[s.estado];
                const pc = PRIORIDAD_COLORS[s.prioridad];
                return (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setDetailModal(s)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 font-semibold whitespace-nowrap">{s.codigo}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 max-w-[200px] truncate">{s.actividad}</p>
                      {s.prioridad !== "Normal" && (
                        <Badge label={s.prioridad} bg={pc.bg} text={pc.text} size="xs" />
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[140px]">
                      <p className="text-xs font-medium text-slate-700 truncate">{sol?.nombre ?? "—"}</p>
                      <p className="text-[10px] text-slate-400 truncate">{sol?.dependencia ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{formatDate(s.fechaActividad)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{s.horaInicio}–{s.horaFin}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[130px]">
                      <p className="truncate">{s.lugar}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge label={s.estado} bg={c.bg} text={c.text} dot={c.dot} size="xs" />
                    </td>
                    <td className="px-4 py-3">
                      {resp ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-navy text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {resp.primerNombre[0]}{resp.primerApellido[0]}
                          </div>
                          <span className="text-xs text-slate-600 truncate max-w-[90px]">
                            {resp.primerNombre} {resp.primerApellido}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 italic">Sin asignar</span>
                      )}
                    </td>
                    {!isLector && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setDetailModal(s)}
                            className="p-1.5 text-slate-400 hover:text-navy hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalle"
                          >
                            <IconEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(s)}
                            className="px-2.5 py-1.5 text-slate-400 hover:text-navy hover:bg-blue-50 rounded-full transition-colors"
                            title="Editar"
                          >
                            <IconEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(s)}
                            className="px-2.5 py-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Eliminar"
                          >
                            <IconTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Mostrando {filtered.length} de {solicitudes.length} solicitudes
            {filterEstado !== "Todos" && <span className="ml-1">· Filtrado por: <strong>{filterEstado}</strong></span>}
          </p>
          {filterEstado !== "Todos" && (
            <button onClick={() => setFilterEstado("Todos")} className="text-xs text-navy font-medium hover:underline">
              Limpiar filtro
            </button>
          )}
        </div>
      </div>

      {/* ── CREATE MODAL ── */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nueva solicitud de cobertura"
        subtitle="Complete los campos para registrar la solicitud."
        size="lg"
        footer={formFooter(true)}
      >
        {formBody}
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title="Editar solicitud"
        subtitle={editModal?.codigo}
        size="lg"
        footer={formFooter(false)}
      >
        {formBody}
      </Modal>

      {/* ── DETAIL MODAL ── */}
      {detailModal && (() => {
        const s = detailModal;
        const sol = solicitantes.find((x) => x.id === s.solicitanteId);
        const resp = s.responsableId ? usuarios.find((u) => u.id === s.responsableId) : null;
        const c = ESTADO_COLORS[s.estado];
        return (
          <Modal
            open
            onClose={() => setDetailModal(null)}
            title={s.actividad}
            subtitle={s.codigo}
            size="lg"
            footer={
              <>
                {can("edit") && (
                  <button
                    onClick={() => { openEdit(s); setDetailModal(null); }}
                    className="flex items-center gap-2 bg-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg btn-primary"
                  >
                    <IconEdit className="w-4 h-4" /> Editar
                  </button>
                )}
                {can("delete") && (
                  <button
                    onClick={() => { setConfirmDelete(s); setDetailModal(null); }}
                    className="flex items-center gap-2 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <IconTrash className="w-4 h-4" /> Eliminar
                  </button>
                )}
                <button onClick={() => setDetailModal(null)} className="ml-auto text-sm text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-100 transition-colors">
                  Cerrar
                </button>
              </>
            }
          >
            <div className="space-y-5">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge label={s.estado} bg={c.bg} text={c.text} dot={c.dot} />
                <Badge label={`Prioridad ${s.prioridad}`} bg={PRIORIDAD_COLORS[s.prioridad].bg} text={PRIORIDAD_COLORS[s.prioridad].text} />
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: IconCalendar, label: "Fecha", value: new Date(s.fechaActividad + "T12:00:00").toLocaleDateString("es-GT", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) },
                  { icon: IconClock, label: "Horario", value: s.horaInicio && s.horaFin ? `${s.horaInicio} – ${s.horaFin}` : "—" },
                  { icon: IconMapPin, label: "Lugar", value: s.lugar || "—" },
                  { icon: IconUser, label: "Solicitante", value: sol?.nombre ?? "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3.5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{label}</span>
                    </div>
                    <p className="text-sm text-slate-800 font-medium leading-snug">{value}</p>
                  </div>
                ))}
              </div>

              {s.descripcion && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Descripción</p>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-4">{s.descripcion}</p>
                </div>
              )}

              {/* Responsable */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Responsable a cargo</p>
                  {resp ? (
                    <div className="flex items-center gap-2 bg-navy/5 rounded-lg px-3 py-2.5">
                      <div className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {resp.primerNombre[0]}{resp.primerApellido[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy">{getNombreCompleto(resp)}</p>
                        <p className="text-xs text-slate-500">{resp.cargo}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Sin responsable asignado</p>
                  )}
                </div>

                {s.asignados.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Personal de apoyo</p>
                    <div className="space-y-1.5">
                      {s.asignados.map((uid) => {
                        const u = getUsuarioById(uid);
                        if (!u) return null;
                        return (
                          <div key={uid} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                            <div className="w-6 h-6 rounded-full bg-navy text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {u.primerNombre[0]}{u.primerApellido[0]}
                            </div>
                            <p className="text-xs font-medium text-slate-700">{getNombreCompleto(u)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Cambiar estado — solo para usuarios con permisos */}
              {can("changeEstado") && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Cambiar estado</p>
                  <div className="flex flex-wrap gap-2">
                    {KANBAN_COLUMNS.map((estado) => {
                      const cc = ESTADO_COLORS[estado];
                      const isActive = s.estado === estado;
                      return (
                        <button
                          key={estado}
                          onClick={() => !isActive && setConfirmEstado({ sol: s, newEstado: estado })}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all
                            ${isActive
                              ? `${cc.bg} ${cc.text} border-current font-bold`
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 cursor-pointer"
                            }`}
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

      {/* ── DELETE CONFIRM ── */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="¿Eliminar solicitud?"
        message={`La solicitud "${confirmDelete?.actividad}" será eliminada permanentemente. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        variant="danger"
      />

      {/* ── CHANGE ESTADO CONFIRM ── */}
      <ConfirmDialog
        open={!!confirmEstado}
        onClose={() => setConfirmEstado(null)}
        onConfirm={handleChangeEstado}
        title="¿Cambiar estado?"
        message={`La solicitud pasará al estado "${confirmEstado?.newEstado}". ¿Desea continuar?`}
        confirmLabel="Sí, cambiar"
        variant="warning"
      />
    </div>
  );
}
