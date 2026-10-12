Diseña un prototipo completo y profesional de una aplicación web llamada **“Sistema Web de Gestión Operativa de Comunicación Social”**, desarrollada para la **Dirección de Comunicación Social de la Municipalidad de Santiago Atitlán, Sololá, Guatemala**.

El sistema tiene como finalidad centralizar y organizar la gestión de solicitudes de cobertura de actividades municipales, permitiendo planificar actividades, asignar personal, administrar la información de los solicitantes, dar seguimiento mediante un tablero Kanban, consultar las actividades en un calendario y generar reportes.

IMPORTANTE:
El diseño debe representar un sistema administrativo funcional y coherente. No crear una landing page, página comercial ni una aplicación genérica. Todas las pantallas deben estar conectadas conceptualmente y utilizar la misma estructura visual, navegación, componentes y estilos.

## ESTRUCTURA PRINCIPAL

El sistema debe tener exactamente estos 7 módulos principales en el menú lateral:

1. Tablero Kanban
2. Solicitudes
3. Calendario
4. Usuarios
5. Reportes
6. Solicitantes
7. Configuración

No crear “Cobertura”, “Publicaciones”, “Recursos” ni otros módulos independientes. Las funciones relacionadas deben integrarse dentro de los siete módulos establecidos.

## ESTILO VISUAL

Crear una interfaz moderna, profesional, limpia y apropiada para una institución municipal.

Utilizar:

* Diseño web administrativo.
* Barra lateral izquierda para la navegación principal.
* Barra superior con nombre del sistema, notificaciones y perfil del usuario.
* Tarjetas informativas.
* Tablas profesionales.
* Formularios organizados por secciones.
* Modales para acciones rápidas.
* Botones claramente diferenciados.
* Iconografía sencilla y consistente.
* Diseño responsive para escritorio y tablet.
* Buena jerarquía visual.
* Espacios adecuados entre elementos.
* Tipografía moderna y fácil de leer.
* Paleta institucional sobria y profesional.
* Estados visuales claros para solicitudes, usuarios y actividades.

Evitar diseños excesivamente coloridos, elementos decorativos innecesarios y apariencia de aplicación móvil.

---

# 1. TABLERO KANBAN

Diseñar una pantalla principal de tablero Kanban para visualizar el flujo de trabajo de las solicitudes.

La pantalla debe incluir:

* Título “Tablero Kanban”.
* Botón “Nueva solicitud”.
* Buscador.
* Filtros.
* Tarjetas organizadas por estados.
* Cada tarjeta debe mostrar:

  * Código de solicitud.
  * Nombre de la actividad.
  * Fecha.
  * Horario.
  * Lugar.
  * Solicitante.
  * Usuario(s) asignado(s).
  * Indicador de prioridad si corresponde.

Las tarjetas deben poder visualizarse conceptualmente mediante arrastrar y soltar entre columnas.

Utilizar estados de trabajo coherentes, por ejemplo:

* Pendiente
* En proceso
* Programada
* En ejecución
* Finalizada

Al seleccionar una tarjeta, mostrar el detalle de la solicitud.

---

# 2. SOLICITUDES

Crear un módulo completo para registrar, consultar y administrar solicitudes.

La pantalla principal debe incluir:

* Título “Solicitudes”.
* Botón “Nueva solicitud”.
* Buscador.
* Filtros.
* Tabla de solicitudes.
* Código.
* Actividad.
* Solicitante.
* Fecha de actividad.
* Horario.
* Lugar.
* Estado.
* Responsable.
* Acciones.

Crear una pantalla/formulario de “Nueva solicitud” con campos:

* Solicitante.
* Fecha de actividad.
* Hora de inicio.
* Hora de finalización.
* Lugar.
* Descripción de la actividad.

La descripción debe permitir una extensión amplia, aproximadamente hasta 1000 caracteres.

Incluir botones:

* Cancelar
* Guardar solicitud

Crear también una pantalla de detalle de solicitud donde se pueda visualizar toda la información y realizar acciones como:

* Editar solicitud.
* Asignar personal.
* Asignar recursos necesarios.
* Cambiar estado.
* Consultar información relacionada.

---

# 3. CALENDARIO

Crear un módulo de calendario para visualizar las actividades programadas.

Incluir:

* Vista mensual.
* Vista semanal.
* Vista diaria.
* Botón “Nueva actividad” o “Nueva solicitud”.
* Navegación entre fechas.
* Actividades representadas visualmente dentro del calendario.

Cada actividad debe mostrar de forma resumida:

* Nombre de la actividad.
* Horario.
* Lugar.
* Estado.

Al seleccionar una actividad, mostrar un panel o ventana con el detalle de la solicitud y los usuarios asignados.

El calendario debe permitir identificar fácilmente actividades que ocurren el mismo día y facilitar la planificación del trabajo.

---

# 4. USUARIOS

Crear un módulo para administrar al personal que utiliza el sistema.

La pantalla principal debe incluir:

* Título “Usuarios”.
* Botón “Nuevo usuario”.
* Buscador.
* Filtros.
* Tabla de usuarios.

Mostrar información como:

* Nombre completo.
* Tipo de empleado.
* Cargo.
* Rol.
* Estado.
* Acciones.

Crear formulario para registrar un usuario con información organizada en secciones.

Utilizar los campos de nombres:

* Primer nombre.
* Segundo nombre.
* Primer apellido.
* Segundo apellido.

Incluir información relacionada con:

* Tipo de empleado.
* Cargo.
* Rol.
* Estado.
* Datos de cuenta.

Los roles del sistema son:

* Administrador.
* Director de dependencia.
* Lector.

Los estados de usuario contemplados son:

* Activo.
* En línea.
* En pausa.
* Bloqueado.
* Inactivo.

Crear acciones para:

* Ver usuario.
* Editar usuario.
* Cambiar estado.
* Administrar cuenta.

---

# 5. REPORTES

Crear un módulo de reportes orientado al control y análisis de la gestión de Comunicación Social.

La pantalla debe incluir tarjetas con indicadores generales, por ejemplo:

* Total de solicitudes.
* Solicitudes pendientes.
* Solicitudes en proceso.
* Solicitudes finalizadas.
* Actividades programadas.

Incluir diferentes tipos de reportes:

* Solicitudes por estado.
* Actividades por período.
* Actividades realizadas.
* Personal asignado.
* Recursos utilizados.
* Solicitudes por solicitante.

Incluir filtros por:

* Fecha inicial.
* Fecha final.
* Estado.
* Solicitante.
* Usuario.

Agregar botón:

“Generar reporte PDF”

Diseñar una vista previa del reporte antes de generar el documento.

---

# 6. SOLICITANTES

Crear un módulo independiente para administrar a las personas que realizan las solicitudes.

IMPORTANTE:
Los solicitantes son diferentes de los usuarios internos del sistema.

La pantalla debe incluir:

* Título “Solicitantes”.
* Botón “Nuevo solicitante”.
* Buscador.
* Tabla de solicitantes.
* Información de contacto necesaria.
* Cantidad de solicitudes realizadas.
* Acciones.

Crear formulario para registrar un solicitante.

Crear también una vista de detalle del solicitante donde se pueda consultar:

* Información del solicitante.
* Historial de solicitudes.
* Actividades solicitadas.
* Estado de cada solicitud.

---

# 7. CONFIGURACIÓN

Crear un módulo administrativo para configurar los parámetros utilizados por el sistema.

La pantalla debe presentar diferentes opciones de configuración mediante tarjetas o secciones.

Incluir:

* Roles de usuario.
* Tipos de empleado.
* Cargos.
* Estados de usuario.
* Estados del flujo Kanban.
* Parámetros generales del sistema.

La interfaz debe mostrar claramente que este módulo está destinado a la administración del sistema.

El acceso debe estar pensado principalmente para el rol Administrador.

---

# DASHBOARD / PANTALLA INICIAL

Aunque los siete módulos anteriores son los módulos generales del sistema, crear una pantalla inicial de resumen que se muestre después de ingresar al sistema.

Esta pantalla debe presentar:

* Bienvenida al usuario.
* Resumen de solicitudes.
* Actividades próximas.
* Solicitudes pendientes.
* Solicitudes en proceso.
* Actividades programadas.
* Accesos rápidos a:

  * Nueva solicitud.
  * Tablero Kanban.
  * Calendario.
  * Reportes.

La pantalla debe servir como punto de entrada y resumen general, sin convertir “Dashboard” en un módulo adicional del menú principal.

---

# NAVEGACIÓN

Crear un menú lateral persistente con:

* Inicio
* Tablero Kanban
* Solicitudes
* Calendario
* Usuarios
* Reportes
* Solicitantes
* Configuración

Mostrar visualmente cuál es la sección activa.

En la parte superior incluir:

* Nombre del sistema.
* Notificaciones.
* Nombre del usuario.
* Rol del usuario.
* Menú de perfil.

---

# ROLES Y PERMISOS

El prototipo debe contemplar diferentes niveles de acceso:

ADMINISTRADOR:
Acceso completo al sistema y configuración.

DIRECTOR DE DEPENDENCIA:
Acceso a la gestión y seguimiento de solicitudes, calendario, usuarios relacionados con la operación y reportes según sus permisos.

LECTOR:
Acceso principalmente de consulta, sin permitir modificaciones administrativas.

Representar visualmente las acciones disponibles dependiendo del rol.

---

# FLUJO PRINCIPAL DEL SISTEMA

El prototipo debe reflejar este flujo:

1. Un solicitante realiza una solicitud de cobertura de una actividad municipal.
2. La solicitud se registra en el módulo “Solicitudes”.
3. La solicitud aparece en el “Tablero Kanban”.
4. Se revisa y organiza la solicitud.
5. Se asigna el personal necesario.
6. Se asignan los recursos necesarios.
7. La actividad queda reflejada en el “Calendario”.
8. Se realiza seguimiento mediante el tablero Kanban.
9. La solicitud cambia de estado conforme avanza el trabajo.
10. La actividad se finaliza.
11. La información queda disponible para consulta.
12. Los responsables pueden generar reportes.

El prototipo debe permitir comprender este flujo únicamente observando la navegación y las pantallas.

---

# PANTALLAS QUE DEBE GENERAR

Crear como mínimo las siguientes pantallas:

1. Inicio / Dashboard.
2. Tablero Kanban.
3. Detalle de tarjeta Kanban.
4. Lista de solicitudes.
5. Nueva solicitud.
6. Detalle de solicitud.
7. Edición de solicitud.
8. Calendario mensual.
9. Calendario semanal.
10. Detalle de actividad.
11. Lista de usuarios.
12. Nuevo usuario.
13. Detalle de usuario.
14. Lista de solicitantes.
15. Nuevo solicitante.
16. Detalle de solicitante.
17. Reportes.
18. Vista previa de reporte.
19. Configuración.
20. Gestión de roles.
21. Gestión de cargos.
22. Gestión de tipos de empleado.
23. Gestión de estados.

Crear estados visuales para:

* Carga.
* Sin resultados.
* Confirmación.
* Error.
* Éxito.
* Eliminación o desactivación.

El resultado debe parecer un prototipo real de un sistema institucional listo para ser presentado como parte de un proyecto universitario de Ingeniería en Sistemas.

Mantener consistencia visual, nombres en español, navegación coherente y relaciones claras entre todas las pantallas.
