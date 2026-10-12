import { useState } from "react";
import {
  ROL_COLORS, USUARIO_ESTADO_COLORS, TIPOS_EMPLEADO, CARGOS, ROLES, ESTADOS_USUARIO,
  getNombreCompleto, type Usuario, type UsuarioRol, type UsuarioEstado
} from "../data/mockData";
import { useApp } from "../context/AppContext";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Badge from "../components/Badge";
import {
  IconPlus, IconSearch, IconEye, IconEdit, IconTrash, IconCheck,
  IconUser, IconMail, IconPhone, IconDocument, IconRefresh
} from "../components/Icons";

const EMPTY_FORM = {
  primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "",
  tipoEmpleado: "", cargo: "", rol: "Lector" as UsuarioRol, estado: "Activo" as UsuarioEstado,
  email: "", telefono: "", username: "",
};

export default function Usuarios() {
  const { usuarios, addUsuario, updateUsuario, deleteUsuario } = useApp();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [filterRol, setFilterRol] = useState("Todos");

  const [detailModal, setDetailModal] = useState<Usuario | null>(null);
  const [editModal, setEditModal] = useState<Usuario | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Usuario | null>(null);
  const [confirmEstado, setConfirmEstado] = useState<{ u: Usuario; newEstado: UsuarioEstado } | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);

  const filtered = usuarios.filter((u) => {
    const name = getNombreCompleto(u).toLowerCase();
    const matchS = !search || name.includes(search.toLowerCase()) || u.email.includes(search.toLowerCase());
    const matchR = filterRol === "Todos" || u.rol === filterRol;
    return matchS && matchR;
  });

  const openCreate = () => { setForm(EMPTY_FORM); setCreateOpen(true); };

  const openEdit = (u: Usuario) => {
    setEditModal(u);
    setForm({
      primerNombre: u.primerNombre, segundoNombre: u.segundoNombre,
      primerApellido: u.primerApellido, segundoApellido: u.segundoApellido,
      tipoEmpleado: u.tipoEmpleado, cargo: u.cargo, rol: u.rol, estado: u.estado,
      email: u.email, telefono: u.telefono, username: u.username,
    });
  };

  const handleCreate = () => {
    setFormLoading(true);
    setTimeout(() => {
      addUsuario({ ...form, id: `u${Date.now()}`, createdAt: new Date().toISOString().split("T")[0] });
      setFormLoading(false);
      setCreateOpen(false);
      toast.success("Usuario registrado", `${form.primerNombre} ${form.primerApellido} fue agregado al sistema.`);
    }, 600);
  };

  const handleEdit = () => {
    if (!editModal) return;
    setFormLoading(true);
    setTimeout(() => {
      const updated = { ...editModal, ...form };
      updateUsuario(updated);
      if (detailModal?.id === editModal.id) setDetailModal(updated);
      setFormLoading(false);
      setEditModal(null);
      toast.success("Usuario actualizado", "Los cambios fueron guardados correctamente.");
    }, 600);
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteUsuario(confirmDelete.id);
    setConfirmDelete(null);
    if (detailModal?.id === confirmDelete.id) setDetailModal(null);
    toast.error("Usuario eliminado", `"${getNombreCompleto(confirmDelete)}" fue eliminado del sistema.`);
  };

  const handleChangeEstado = () => {
    if (!confirmEstado) return;
    const updated = { ...confirmEstado.u, estado: confirmEstado.newEstado };
    updateUsuario(updated);
    if (detailModal?.id === confirmEstado.u.id) setDetailModal(updated);
    toast.success("Estado actualizado", `Usuario cambiado a "${confirmEstado.newEstado}".`);
    setConfirmEstado(null);
  };

  const canSave = form.primerNombre && form.primerApellido && form.email;

  const userFormBody = (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Datos personales</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Primer nombre *", key: "primerNombre", ph: "Ej. Ana" },
            { label: "Segundo nombre", key: "segundoNombre", ph: "Ej. María" },
            { label: "Primer apellido *", key: "primerApellido", ph: "Ej. García" },
            { label: "Segundo apellido", key: "segundoApellido", ph: "Ej. Ramos" },
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
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Información laboral</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de empleado</label>
            <select value={form.tipoEmpleado} onChange={(e) => setForm({ ...form, tipoEmpleado: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20">
              <option value="">Seleccionar...</option>
              {TIPOS_EMPLEADO.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cargo</label>
            <select value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20">
              <option value="">Seleccionar...</option>
              {CARGOS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Rol del sistema</label>
            <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as UsuarioRol })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20">
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado</label>
            <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as UsuarioEstado })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20">
              {ESTADOS_USUARIO.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Datos de cuenta</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="usuario@muni-santiago.gob.gt"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
            <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="7721-XXXX"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de usuario</label>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="apellido.nombre"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="font-bold text-slate-900 text-lg">Usuarios</h2>
        <div className="flex-1" />
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuario..."
            className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 bg-white w-52" />
        </div>
        <select value={filterRol} onChange={(e) => setFilterRol(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-navy/20">
          <option value="Todos">Todos los roles</option>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <button onClick={openCreate} className="flex items-center gap-2 bg-navy text-white text-sm font-semibold px-4 py-2 rounded-lg btn-primary">
          <IconPlus className="w-4 h-4" /> Nuevo usuario
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Nombre completo", "Tipo empleado", "Cargo", "Rol", "Estado", "Correo", "Acciones"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-14 text-center text-slate-400">
                <IconUser className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No se encontraron usuarios.</p>
              </td></tr>
            ) : filtered.map((u) => {
              const rC = ROL_COLORS[u.rol];
              const eC = USUARIO_ESTADO_COLORS[u.estado];
              return (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {u.primerNombre[0]}{u.primerApellido[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{getNombreCompleto(u)}</p>
                        <p className="text-xs text-slate-400">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{u.tipoEmpleado || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[160px]"><p className="truncate">{u.cargo || "—"}</p></td>
                  <td className="px-4 py-3"><Badge label={u.rol} bg={rC.bg} text={rC.text} size="xs" /></td>
                  <td className="px-4 py-3"><Badge label={u.estado} bg={eC.bg} text={eC.text} dot={eC.dot} size="xs" /></td>
                  <td className="px-4 py-3 text-xs text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetailModal(u)} className="p-1.5 text-slate-400 hover:text-navy hover:bg-blue-50 rounded-lg transition-colors" title="Ver">
                        <IconEye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(u)} className="px-2.5 py-1.5 text-slate-400 hover:text-navy hover:bg-blue-50 rounded-full transition-colors" title="Editar">
                        <IconEdit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setConfirmDelete(u)} className="px-2.5 py-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Eliminar">
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
          <p className="text-xs text-slate-500">Mostrando {filtered.length} de {usuarios.length} usuarios</p>
        </div>
      </div>

      {/* CREATE */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo usuario del sistema"
        subtitle="Complete la información del personal de la dependencia." size="lg"
        footer={
          <>
            <button onClick={handleCreate} disabled={!canSave || formLoading}
              className="flex items-center gap-2 bg-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg btn-primary disabled:opacity-50">
              {formLoading ? <IconRefresh className="w-4 h-4 animate-spin" /> : <IconCheck className="w-4 h-4" />}
              {formLoading ? "Guardando..." : "Guardar usuario"}
            </button>
            <button onClick={() => setCreateOpen(false)} className="text-sm text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-100">Cancelar</button>
          </>
        }
      >
        {userFormBody}
      </Modal>

      {/* EDIT */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Editar usuario"
        subtitle={editModal ? getNombreCompleto(editModal) : ""} size="lg"
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
        {userFormBody}
      </Modal>

      {/* DETAIL */}
      {detailModal && (() => {
        const u = detailModal;
        const rC = ROL_COLORS[u.rol];
        const eC = USUARIO_ESTADO_COLORS[u.estado];
        return (
          <Modal open onClose={() => setDetailModal(null)} title={getNombreCompleto(u)} subtitle={u.cargo} size="md"
            footer={
              <>
                <button onClick={() => { openEdit(u); setDetailModal(null); }} className="flex items-center gap-2 bg-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg btn-primary">
                  <IconEdit className="w-4 h-4" /> Editar
                </button>
                <button onClick={() => { setConfirmDelete(u); setDetailModal(null); }} className="flex items-center gap-2 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-red-50">
                  <IconTrash className="w-4 h-4" /> Eliminar
                </button>
                <button onClick={() => setDetailModal(null)} className="ml-auto text-sm text-slate-600 px-4 py-2.5 rounded-lg hover:bg-slate-100">Cerrar</button>
              </>
            }
          >
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-navy text-white text-xl font-bold flex items-center justify-center shrink-0">
                  {u.primerNombre[0]}{u.primerApellido[0]}
                </div>
                <div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge label={u.rol} bg={rC.bg} text={rC.text} />
                    <Badge label={u.estado} bg={eC.bg} text={eC.text} dot={eC.dot} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">{u.tipoEmpleado} · @{u.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: IconMail, label: "Correo", value: u.email },
                  { icon: IconPhone, label: "Teléfono", value: u.telefono || "—" },
                  { icon: IconUser, label: "Cargo", value: u.cargo || "—" },
                  { icon: IconUser, label: "Registrado", value: new Date(u.createdAt + "T12:00:00").toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" }) },
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
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Cambiar estado</p>
                <div className="flex flex-wrap gap-2">
                  {ESTADOS_USUARIO.map((estado) => {
                    const c = USUARIO_ESTADO_COLORS[estado];
                    const isActive = u.estado === estado;
                    return (
                      <button key={estado}
                        onClick={() => !isActive && setConfirmEstado({ u, newEstado: estado })}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all
                          ${isActive ? `${c.bg} ${c.text} border-current` : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"}`}
                      >
                        {estado}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}

      <ConfirmDialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="¿Eliminar usuario?" variant="danger" confirmLabel="Sí, eliminar"
        message={`El usuario "${confirmDelete ? getNombreCompleto(confirmDelete) : ""}" será eliminado permanentemente.`} />

      <ConfirmDialog open={!!confirmEstado} onClose={() => setConfirmEstado(null)} onConfirm={handleChangeEstado}
        title="¿Cambiar estado?" variant="warning" confirmLabel="Sí, cambiar"
        message={`El usuario pasará al estado "${confirmEstado?.newEstado}". ¿Desea continuar?`} />
    </div>
  );
}
