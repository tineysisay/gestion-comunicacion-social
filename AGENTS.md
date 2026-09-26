# AGENTS.md - Sistema de Gestion Operativa de Comunicacion Social

## Project Overview
- **Type**: University semester project ("1 SEMINARIO")
- **Stack**: Angular 17.3 (standalone components, no NgModules, no Angular Material) + Node.js/Express + MySQL
- **Database**: `gestion_comunicacion_social` on localhost, user `root`, password `12345678`
- **Backend port**: 3000 | **Frontend port**: 4200
- **JWT secret**: `comunicacion_social_2024_secret_key`, expires 8h
- **Git branch**: `fase-0-jwt`
- **Custom CSS only** (no frameworks, no Angular Material)
- **Chart.js** installed for reportes dashboard

## Important Conventions
- User insists: **no breaking existing code**, no rebuilding architecture, verify before changes, work in phases
- Route mounting must be AFTER login endpoint (lesson learned)
- `app.use('/api', catalogRoutes)` must come AFTER login route
- PowerShell on Windows: use `;` not `&&` for chaining commands
- MySQL full path: `"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p12345678 gestion_comunicacion_social -e "..."`
- Roles: Admin (1), Lector (2), Jefe (3) — with `soloAdmin`, `soloAdminYJefe`, `soloLectura` middleware
- SolicitudService has BehaviorSubject for cross-component updates (kanban ↔ calendario ↔ solicitudes)

## Database Tables (key ones)
- `datos_usuario` (id_usuario PK) — personal data: primer_nombre, primer_apellido, dpi, telefono, correo_electronico, id_cargo
- `cuenta_usuario` (id_cuenta PK, id_usuario FK) — login: nombre_usuario, contrasena, id_rol, id_estado_usuario
- `solicitante` (id_solicitante PK) — primer_nombre, primer_apellido, telefono, correo_electronico, id_institucion
- `solicitud_actividad` (id_solicitud PK) — id_solicitante, id_estado_actividad, id_prioridad, fecha_actividad, hora_inicio, hora_fin, nombre_actividad, descripcion_actividad, lugar_actividad, fecha_creacion
- `asignacion_usuario` (id_asignacion_usuario PK) — id_solicitud, id_usuario, fecha_asignacion, observacion
- `asignacion_recurso` (id_asignacion_recurso PK) — id_solicitud, id_recurso, cantidad
- `estado_actividad` — id_estado_actividad, nombre_estado (REVISION=1, AUTORIZADO=2, EN PROCESO=3, FINALIZADO=4, CANCELADO=5), orden_kanban
- `prioridad_actividad` — id_prioridad, nombre_prioridad (BAJA=1, MEDIA=2, ALTA=3, URGENTE=4), nivel_prioridad
- **NOTE**: There is NO `usuario` table. User data is split across `datos_usuario` (personal) and `cuenta_usuario` (login). Queries must JOIN both when needed.

## Git Commits History
- `81078e5` — Fase 0: JWT auth
- `94d1aa8` — Fase 1A+1B: catalogos + solicitantes
- `6777563` — Route mounting fix
- `c788ba6` — Fase 1C+1D: recursos + solicitudes
- `8bc3c64` — Fase 1E: asignaciones
- `7570e27` — Fase 1F: historial + notificaciones
- `86dd38c` — Fase 1G: reportes
- `2945983` — Fase 2: frontend modules
- `70f527e` — Fase 2: calendario + ajustes
- `274df62` — Fase 2: reportes
- `62e0c65` — Kanban + calendario fix
- `2f4408f` — Calendario: buscar solicitudes desde array completo
- `b9e25b2` — Calendario: modal flotante estilo Kanban
- `c84c05c` — Kanban: boton Editar solo admin, redirige a solicitudes
- `d913e4f` — Kanban: edicion inline con accordion
- `9b0513f` — Calendario: navegacion dia con cambiarDia()
- `bbb63d2` — Kanban: letras grandes, solicitante → responsable
- `5dec38d` — Formularios: accordion Responsable(s) con checkboxes
- `39a4b91` — Fix: query GET solicitudes usa datos_usuario con GROUP_CONCAT
- `9c44233` — Kanban: header tarjetas con franja de color prioridad

## Last State (Sept 16, 2026)
- All Fases (0-2) complete
- Kanban: inline edit (admin only), responsable assigned, header with priority color stripe
- Calendario: mes/semana/dia views, navigation working, modal detail
- Solicitudes: CRUD with accordions (Datos, Solicitante, Responsable, Estado/Prioridad)
- Reportes: Chart.js dashboard (admin only)
- Configuracion: Perfil + Recursos tabs + 8 catalog tabs
- 5 new activities and 5 new solicitantes added to DB

## Routes (app.routes.ts)
- `/login` — LoginComponent
- `/inicio` — InicioComponent (sidebar layout)
  - `/inicio/kanban` — KanbanComponent
  - `/inicio/usuarios` — UsuariosComponent (admin)
  - `/inicio/solicitantes` — SolicitantesComponent (admin)
  - `/inicio/solicitudes` — SolicitudesComponent
  - `/inicio/calendario` — CalendarioComponent
  - `/inicio/configuracion` — ConfiguracionComponent
  - `/inicio/reportes` — ReportesComponent (admin only)
