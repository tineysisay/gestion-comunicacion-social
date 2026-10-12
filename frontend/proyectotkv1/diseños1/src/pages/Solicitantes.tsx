import { useState } from "react";
import { ESTADO_COLORS, type Solicitante } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Badge from "../components/Badge";
import {
  IconPlus, IconSearch, IconEye, IconEdit, IconTrash, IconCheck,
  IconMail, IconPhone, IconOffice, IconDocument, IconUser, IconRefresh
} from "../components/Icons";

const EMPTY_FORM = { nombre: "", dependencia: "", cargo: "", telefono: "", email: "" };

export default function Solicitantes() {
  const { solicitantes, solicitudes, addSolicitante, updateSolicitante, deleteSolicitante } = useApp();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [detailModal, setDetailModal] = useState<Solicitante | null>(null);
  const [editModal, setEditModal] = useState<Solicitante | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Solicitante | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);

  const filtered = solicitantes.filter((s) => {
    const q = search.toLowerCase();
    return !search || s.nombre.toLowerCase().includes(q) || s.dependencia.toLowerCase().includes(q);
  });

  const getSolicitudesDelSolicitante = (id: string) =>
    solicitudes.filter((s) => s.solicitanteId === id);

  const openCreate = () => { setForm(EMPTY_FORM); setCreateOpen(true); };

  const openEdit = (s: Solicitante) => {
    setEditModal(s);
    setForm({ nombre: s.nombre, dependencia: s.dependencia, cargo: s.cargo, telefono: s.telefono, email: s.email });
  };

  const handleCreate = () => {
    setFormLoading(true);
    setTimeout(() => {
      addSolicitante({
        ...form,
        id: `s${Date.now()}`,
        totalSolicitudes: 0,
        createdAt: new Date().toISOString().split("T")[0],
      });
      setFormLoading(false);
      setCreateOpen(false);
      toast.success("Solicitante registrado", `${form.nombre} fue agregado correctamente.`);
    }, 600);
  };

  const handleEdit = () => {
    if (!editModal) return;
    setFormLoading(true);
    setTimeout(() => {
      const updated = { ...editModal, ...form };
      updateSolicitante(updated);
      if (detailModal?.id === editModal.id) setDetailModal(updated);
      setFormLoading(false);
      setEditModal(null);
      toast.success("Solicitante actualizado", "Los cambios fueron guardados.");
    }, 600);
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    const historial = getSolicitudesDelSolicitante(confirmDelete.id);
    if (historial.length > 0) {
      toast.warning("No se puede eliminar", `Este solicitante tiene ${historial.length} solicitud(es) registrada(s).`);
      setConfirmDelete(null);
      return;
    }
    deleteSolicitante(confirmDelete.id);
    if (detailModal?.id === confirmDelete.id) setDetailModal(null);
    setConfirmDelete(null);
    toast.error("Solicitante eliminado", `"${confirmDelete.nombre}" fue eliminado del sistema.`);
  };

  const canSave = form.nombre && form.dependencia && form.cargo;

  const SolicitanteForm = () => (
    <div className="space-y-4">
      {[
        { label: "Nombre completo *", key: "nombre", ph: "Ej. Ing. Carlos Eduardo Ajú Ramos" },
        { label: "Dependencia / Institución *", key: "dependencia", ph: "Ej. Dirección Municipal de Planificación" },
        { label: "Cargo *", key: "cargo", ph: "Ej. Director" },
        { label: "Teléfono", key: "telefono", ph: "7721-XXXX" },
        { label: "Correo electrónico", key: "email", ph: "nombre@muni-santiago.gob.gt" },
      ].map(({ label, key, ph }) => (
        <div key={key}>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
          <input
            value={(form as any)[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            placeholder={ph}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="font-bold text-slate-900 text-lg">Solicitantes</h2>
        <div className="flex-1" />
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar solicitante..."
            className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white w-52" />
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-navy text-white text-sm font-semibold px-4 py-2 rounded-lg btn-primary">
          <IconPlus className="w-4 h-4" /> Nuevo solicitante
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Nombre", "Dependencia", "Cargo", "Teléfono", "Correo", "Solicitudes", "Acciones"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-14 text-center text-slate-400">
                <IconUser className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No se encontraron solicitantes.</p>
              </td></tr>
            ) : filtered.map((s) => {
              const historial = getSolicitudesDelSolicitante(s.id);
              return (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                        {s.nombre.charAt(0)}
                      </div>
                      <p className="font-medium text-slate-900 max-w-[160px] truncate">{s.nombre}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[160px]"><p className="truncate">{s.dependencia}</p></td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[120px]"><p className="truncate">{s.cargo}</p></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{s.telefono || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[160px]"><p className="truncate">{s.email || "—"}</p></td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-navy">{historial.length}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetailModal(s)} className="p-1.5 text-slate-400 hover:text-navy hover:bg-blue-50 rounded-lg transition-colors" title="Ver">
                        <IconEye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(s)} className="px-2.5 py-1.5 text-slate-400 hover:text-navy hover:bg-blue-50 rounded-full transition-colors" title="Editar">
                        <IconEdit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(s)} className="px-2.5 py-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Eliminar">
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">Mostrando {filtered.length} de {solicitantes.length} solicitantes</p>
        </div>
      </div>

      {/* CREATE */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo solicitante"
        subtitle="Registre la información de contacto del solicitante."
        footer={
          <>
            <button onClick={handleCreate} disabled={!canSave || formLoading}
              className="flex items-center gap-2 bg-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg btn-primary disabled:opacity-50">
              {formLoading ? <IconRefresh className="w-4 h-4 animate-spin" /> : <IconCheck className="w-4 h-4" />}
              {formLoading ? "Guardando..." : "Guardar solicitante"}
            </button>
            <button onClick={() => setCreateOpen(false)} className="text-sm text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-100">Cancelar</button>
          </>
        }
      >
        <SolicitanteForm />
      </Modal>

      {/* EDIT */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Editar solicitante"
        subtitle={editModal?.nombre}
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
        <SolicitanteForm />
      </Modal>

      {/* DETAIL */}
      {detailModal && (() => {
        const s = detailModal;
        const historial = getSolicitudesDelSolicitante(s.id);
        return (
          <Modal open onClose={() => setDetailModal(null)} title={s.nombre} subtitle={`${s.cargo} · ${s.dependencia}`} size="lg"
            footer={
              <>
                <button onClick={() => { openEdit(s); setDetailModal(null); }} className="flex items-center gap-2 bg-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg btn-primary">
                  <IconEdit className="w-4 h-4" /> Editar
                </button>
                <button onClick={() => { setConfirmDelete(s); setDetailModal(null); }} className="flex items-center gap-2 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-red-50">
                  <IconTrash className="w-4 h-4" /> Eliminar
                </button>
                <button onClick={() => setDetailModal(null)} className="ml-auto text-sm text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-100">Cerrar</button>
              </>
            }
          >
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: IconPhone, label: "Teléfono", value: s.telefono || "—" },
                  { icon: IconMail, label: "Correo", value: s.email || "—" },
                  { icon: IconOffice, label: "Dependencia", value: s.dependencia },
                  { icon: IconUser, label: "Solicitudes totales", value: String(historial.length) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{label}</span>
                    </div>
                    <p className="text-sm text-slate-800 font-medium truncate">{value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Historial de solicitudes</p>
                {historial.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-slate-400">
                    <IconDocument className="w-7 h-7 mb-2 opacity-40" />
                    <p className="text-sm">Sin solicitudes registradas.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {historial.map((sol) => {
                      const c = ESTADO_COLORS[sol.estado];
                      return (
                        <div key={sol.id} className="flex items-center gap-4 bg-slate-50 rounded-lg px-4 py-3">
                          <span className="text-xs font-mono text-slate-400 font-semibold w-24 shrink-0">{sol.codigo}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{sol.actividad}</p>
                            <p className="text-xs text-slate-400">{new Date(sol.fechaActividad + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" })}</p>
                          </div>
                          <Badge label={sol.estado} bg={c.bg} text={c.text} dot={c.dot} size="xs" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </Modal>
        );
      })()}

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="¿Eliminar solicitante?" variant="danger" confirmLabel="Sí, eliminar"
        message={`El solicitante "${confirmDelete?.nombre}" será eliminado permanentemente. Si tiene solicitudes registradas, no se podrá eliminar.`} />
    </div>
  );
}
