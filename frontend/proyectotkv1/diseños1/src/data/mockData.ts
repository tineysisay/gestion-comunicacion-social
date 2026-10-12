export type SolicitudEstado = "Pendiente" | "En proceso" | "Programada" | "En ejecución" | "Finalizada";
export type SolicitudPrioridad = "Alta" | "Media" | "Normal";
export type UsuarioRol = "Administrador" | "Director de dependencia" | "Lector";
export type UsuarioEstado = "Activo" | "En línea" | "En pausa" | "Bloqueado" | "Inactivo";

export interface Solicitante {
  id: string;
  nombre: string;
  dependencia: string;
  cargo: string;
  telefono: string;
  email: string;
  totalSolicitudes: number;
  createdAt: string;
}

export interface Usuario {
  id: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  tipoEmpleado: string;
  cargo: string;
  rol: UsuarioRol;
  estado: UsuarioEstado;
  email: string;
  telefono: string;
  username: string;
  createdAt: string;
  avatar?: string;
}

export interface Solicitud {
  id: string;
  codigo: string;
  actividad: string;
  descripcion: string;
  solicitanteId: string;
  fechaActividad: string;
  horaInicio: string;
  horaFin: string;
  lugar: string;
  estado: SolicitudEstado;
  prioridad: SolicitudPrioridad;
  responsableId?: string;
  asignados: string[];
  recursos: string[];
  createdAt: string;
  updatedAt: string;
}

export const SOLICITANTES: Solicitante[] = [
  {
    id: "s1", nombre: "Ing. Carlos Eduardo Ajú Ramos", dependencia: "Dirección Municipal de Planificación", cargo: "Director", telefono: "7721-1234", email: "c.aju@muni-santiago.gob.gt", totalSolicitudes: 8, createdAt: "2026-01-15"
  },
  {
    id: "s2", nombre: "Lcda. María Concepción Toc Ajú", dependencia: "Oficina Municipal de la Mujer", cargo: "Coordinadora", telefono: "7721-2345", email: "m.toc@muni-santiago.gob.gt", totalSolicitudes: 5, createdAt: "2026-01-20"
  },
  {
    id: "s3", nombre: "Prof. Juan de Dios Mendoza Cholotío", dependencia: "Dirección de Educación", cargo: "Subdirector", telefono: "7721-3456", email: "j.mendoza@muni-santiago.gob.gt", totalSolicitudes: 12, createdAt: "2026-02-01"
  },
  {
    id: "s4", nombre: "Dr. Pedro Antonio Sicay Quiejú", dependencia: "Centro de Salud Municipal", cargo: "Director Médico", telefono: "7721-4567", email: "p.sicay@muni-santiago.gob.gt", totalSolicitudes: 3, createdAt: "2026-02-10"
  },
  {
    id: "s5", nombre: "Arq. Sandra Luisa Chumil Tzoc", dependencia: "Dirección de Infraestructura", cargo: "Coordinadora de Proyectos", telefono: "7721-5678", email: "s.chumil@muni-santiago.gob.gt", totalSolicitudes: 7, createdAt: "2026-02-15"
  },
  {
    id: "s6", nombre: "Lic. Roberto Ajanel Chitay", dependencia: "Juzgado de Asuntos Municipales", cargo: "Juez Municipal", telefono: "7721-6789", email: "r.ajanel@muni-santiago.gob.gt", totalSolicitudes: 2, createdAt: "2026-03-01"
  },
  {
    id: "s7", nombre: "Ing. Agr. Ana Lucía Yach Curruchich", dependencia: "Oficina Municipal de Agricultura", cargo: "Técnica Agrícola", telefono: "7721-7890", email: "a.yach@muni-santiago.gob.gt", totalSolicitudes: 4, createdAt: "2026-03-10"
  },
  {
    id: "s8", nombre: "Prof. Manuel Sojuel Coché", dependencia: "Escuela Primaria Central", cargo: "Director", telefono: "7721-8901", email: "m.sojuel@muni-santiago.gob.gt", totalSolicitudes: 6, createdAt: "2026-03-15"
  },
];

export const USUARIOS: Usuario[] = [
  {
    id: "u1", primerNombre: "Ana", segundoNombre: "María", primerApellido: "García", segundoApellido: "Ramos",
    tipoEmpleado: "Planta", cargo: "Directora de Comunicación Social", rol: "Administrador",
    estado: "En línea", email: "a.garcia@muni-santiago.gob.gt", telefono: "7721-0001", username: "agarcia",
    createdAt: "2025-06-01"
  },
  {
    id: "u2", primerNombre: "Luis", segundoNombre: "Fernando", primerApellido: "Chávez", segundoApellido: "Pérez",
    tipoEmpleado: "Planta", cargo: "Fotógrafo / Camarógrafo", rol: "Director de dependencia",
    estado: "Activo", email: "l.chavez@muni-santiago.gob.gt", telefono: "7721-0002", username: "lchavez",
    createdAt: "2025-06-15"
  },
  {
    id: "u3", primerNombre: "María", segundoNombre: "José", primerApellido: "Ajú", segundoApellido: "Toc",
    tipoEmpleado: "Planta", cargo: "Relacionista Pública", rol: "Director de dependencia",
    estado: "En pausa", email: "m.aju@muni-santiago.gob.gt", telefono: "7721-0003", username: "maju",
    createdAt: "2025-07-01"
  },
  {
    id: "u4", primerNombre: "Carlos", segundoNombre: "Enrique", primerApellido: "Mendez", segundoApellido: "Sicay",
    tipoEmpleado: "Contrato", cargo: "Editor de Video", rol: "Lector",
    estado: "Activo", email: "c.mendez@muni-santiago.gob.gt", telefono: "7721-0004", username: "cmendez",
    createdAt: "2026-01-10"
  },
  {
    id: "u5", primerNombre: "Sandra", segundoNombre: "Patricia", primerApellido: "Curruchich", segundoApellido: "Ajú",
    tipoEmpleado: "Planta", cargo: "Diseñadora Gráfica", rol: "Lector",
    estado: "Activo", email: "s.curruchich@muni-santiago.gob.gt", telefono: "7721-0005", username: "scurruchich",
    createdAt: "2025-08-01"
  },
  {
    id: "u6", primerNombre: "Pedro", segundoNombre: "Antonio", primerApellido: "Rosales", segundoApellido: "Chumil",
    tipoEmpleado: "Contrato", cargo: "Community Manager", rol: "Lector",
    estado: "Inactivo", email: "p.rosales@muni-santiago.gob.gt", telefono: "7721-0006", username: "prosales",
    createdAt: "2026-02-01"
  },
];

export const SOLICITUDES: Solicitud[] = [
  {
    id: "req1", codigo: "SOL-2026-001", actividad: "Inauguración Mercado Municipal Remodelado",
    descripcion: "Cobertura completa del acto de inauguración del mercado municipal que fue objeto de remodelación durante los últimos seis meses. Se requiere fotografía, video y transmisión en vivo por redes sociales. El evento contará con la presencia del Alcalde Municipal, miembros del Concejo, representantes de INFOM y población en general.",
    solicitanteId: "s1", fechaActividad: "2026-09-12", horaInicio: "09:00", horaFin: "12:00",
    lugar: "Mercado Municipal, Santiago Atitlán", estado: "En ejecución", prioridad: "Alta",
    responsableId: "u1", asignados: ["u2", "u3"], recursos: ["Cámara Canon EOS R5", "Trípode profesional", "Micrófono inalámbrico"],
    createdAt: "2026-09-01", updatedAt: "2026-09-05"
  },
  {
    id: "req2", codigo: "SOL-2026-002", actividad: "Campaña de Vacunación Infantil",
    descripcion: "Registro fotográfico y audiovisual de la jornada de vacunación infantil organizada por el Centro de Salud Municipal en coordinación con el MSPAS. La jornada se llevará a cabo en las instalaciones del centro de salud y en puntos estratégicos de las aldeas cercanas.",
    solicitanteId: "s4", fechaActividad: "2026-09-15", horaInicio: "08:00", horaFin: "16:00",
    lugar: "Centro de Salud Municipal y Aldeas", estado: "Programada", prioridad: "Media",
    responsableId: "u2", asignados: ["u2", "u5"], recursos: ["Cámara réflex", "Drone DJI Mini"],
    createdAt: "2026-09-02", updatedAt: "2026-09-03"
  },
  {
    id: "req3", codigo: "SOL-2026-003", actividad: "Taller de Emprendimiento para Mujeres",
    descripcion: "Cobertura fotográfica del taller de emprendimiento dirigido a mujeres de la comunidad, organizado por la Oficina Municipal de la Mujer con apoyo de ONU Mujeres. El evento incluye capacitación, exposición de productos artesanales y premiación a las emprendedoras destacadas.",
    solicitanteId: "s2", fechaActividad: "2026-09-18", horaInicio: "14:00", horaFin: "18:00",
    lugar: "Salón de Usos Múltiples, Municipalidad", estado: "Pendiente", prioridad: "Normal",
    asignados: [], recursos: [],
    createdAt: "2026-09-04", updatedAt: "2026-09-04"
  },
  {
    id: "req4", codigo: "SOL-2026-004", actividad: "Día de la Independencia — Desfile Escolar",
    descripcion: "Cobertura completa del desfile cívico y cultural por el 205 aniversario de la Independencia de Guatemala. Se requiere fotografía y video del desfile, actos culturales en el parque central y discurso del señor Alcalde. Material para redes sociales y archivo institucional.",
    solicitanteId: "s3", fechaActividad: "2026-09-15", horaInicio: "07:00", horaFin: "13:00",
    lugar: "Parque Central y calles principales, Santiago Atitlán", estado: "Programada", prioridad: "Alta",
    responsableId: "u1", asignados: ["u2", "u3", "u4"], recursos: ["Cámara Canon EOS R5", "Drone DJI Mini", "Cámara réflex backup"],
    createdAt: "2026-08-25", updatedAt: "2026-09-01"
  },
  {
    id: "req5", codigo: "SOL-2026-005", actividad: "Entrega de Becas Estudiantiles 2026",
    descripcion: "Registro fotográfico de la ceremonia de entrega de becas estudiantiles a jóvenes de bajos recursos que continuarán estudios universitarios. Evento importante para destacar el compromiso de la municipalidad con la educación.",
    solicitanteId: "s3", fechaActividad: "2026-09-20", horaInicio: "10:00", horaFin: "12:30",
    lugar: "Salón de Sesiones, Municipalidad de Santiago Atitlán", estado: "En proceso", prioridad: "Media",
    responsableId: "u3", asignados: ["u5"], recursos: ["Cámara réflex"],
    createdAt: "2026-09-03", updatedAt: "2026-09-04"
  },
  {
    id: "req6", codigo: "SOL-2026-006", actividad: "Inauguración Sistema de Agua Potable Aldea Cerro de Oro",
    descripcion: "Cobertura del acto oficial de inauguración del sistema de agua potable en Aldea Cerro de Oro, proyecto financiado por la Municipalidad y Gobierno Central. Presencia del señor Alcalde, INFOM y representantes comunitarios.",
    solicitanteId: "s5", fechaActividad: "2026-09-22", horaInicio: "09:00", horaFin: "11:00",
    lugar: "Aldea Cerro de Oro, Santiago Atitlán", estado: "Pendiente", prioridad: "Alta",
    asignados: [], recursos: [],
    createdAt: "2026-09-04", updatedAt: "2026-09-04"
  },
  {
    id: "req7", codigo: "SOL-2026-007", actividad: "Reunión de COCODES — Planificación Territorial",
    descripcion: "Registro fotográfico de la reunión mensual de Consejos Comunitarios de Desarrollo para la planificación de proyectos de infraestructura territorial 2026-2027.",
    solicitanteId: "s1", fechaActividad: "2026-09-08", horaInicio: "14:00", horaFin: "17:00",
    lugar: "Sala de Juntas, Municipalidad", estado: "Finalizada", prioridad: "Normal",
    responsableId: "u2", asignados: ["u2"], recursos: ["Cámara réflex"],
    createdAt: "2026-09-01", updatedAt: "2026-09-08"
  },
  {
    id: "req8", codigo: "SOL-2026-008", actividad: "Feria del Agricultor — Expo Productos Orgánicos",
    descripcion: "Cobertura de la feria anual del agricultor donde productores locales exhiben y comercializan productos orgánicos. Material para difusión en redes sociales y medios locales.",
    solicitanteId: "s7", fechaActividad: "2026-09-27", horaInicio: "08:00", horaFin: "15:00",
    lugar: "Campo Municipal, Santiago Atitlán", estado: "Pendiente", prioridad: "Normal",
    asignados: [], recursos: [],
    createdAt: "2026-09-05", updatedAt: "2026-09-05"
  },
];

export const getNombreCompleto = (usuario: Usuario) =>
  `${usuario.primerNombre} ${usuario.primerApellido} ${usuario.segundoApellido}`;

export const getSolicitanteById = (id: string) =>
  SOLICITANTES.find((s) => s.id === id);

export const getUsuarioById = (id: string) =>
  USUARIOS.find((u) => u.id === id);

export const ESTADO_COLORS: Record<SolicitudEstado, { bg: string; text: string; dot: string }> = {
  Pendiente:     { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400" },
  "En proceso":  { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500" },
  Programada:    { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  "En ejecución":{ bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  Finalizada:    { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500" },
};

export const PRIORIDAD_COLORS: Record<SolicitudPrioridad, { bg: string; text: string }> = {
  Alta:   { bg: "bg-red-100",    text: "text-red-700" },
  Media:  { bg: "bg-amber-100",  text: "text-amber-700" },
  Normal: { bg: "bg-slate-100",  text: "text-slate-600" },
};

export const ROL_COLORS: Record<UsuarioRol, { bg: string; text: string }> = {
  Administrador:            { bg: "bg-navy/10",   text: "text-navy" },
  "Director de dependencia":{ bg: "bg-blue-100",  text: "text-blue-700" },
  Lector:                   { bg: "bg-slate-100", text: "text-slate-600" },
};

export const USUARIO_ESTADO_COLORS: Record<UsuarioEstado, { bg: string; text: string; dot: string }> = {
  "En línea": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Activo:     { bg: "bg-green-50",   text: "text-green-700",   dot: "bg-green-400" },
  "En pausa": { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
  Bloqueado:  { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500" },
  Inactivo:   { bg: "bg-slate-50",   text: "text-slate-500",   dot: "bg-slate-300" },
};

export const KANBAN_COLUMNS: SolicitudEstado[] = [
  "Pendiente", "En proceso", "Programada", "En ejecución", "Finalizada"
];

export const TIPOS_EMPLEADO = ["Planta", "Contrato", "Temporal", "Honorario"];
export const CARGOS = [
  "Director de Comunicación Social", "Fotógrafo / Camarógrafo", "Relacionista Pública",
  "Editor de Video", "Diseñadora Gráfica", "Community Manager", "Periodista", "Asistente"
];
export const ROLES: UsuarioRol[] = ["Administrador", "Director de dependencia", "Lector"];
export const ESTADOS_USUARIO: UsuarioEstado[] = ["Activo", "En línea", "En pausa", "Bloqueado", "Inactivo"];
export const ESTADOS_KANBAN: SolicitudEstado[] = ["Pendiente", "En proceso", "Programada", "En ejecución", "Finalizada"];
