# -*- coding: utf-8 -*-
"""
Genera el Manual de Usuarios (.docx) del Sistema de Gestion Operativa
de Comunicacion Social - Municipalidad de Santiago Atitlan.

Uso:  py -3 docs/generar_manual.py
Salida: docs/Manual de Usuarios - Sistema de Gestion Operativa de Comunicacion Social.docx
"""

import os
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from datetime import date

DOCS_DIR = os.path.dirname(os.path.abspath(__file__))
CAPTURAS_DIR = os.path.join(DOCS_DIR, "capturas")

# Mapa: texto del placeholder -> archivo de captura real
CAPTURAS = {
    "Pantalla de inicio de sesión completa": "01-login.png",
    "Interfaz principal con menú lateral visible": "02-kanban.png",
    "Tablero Kanban con sus 5 columnas y tarjetas": "02-kanban.png",
    "Modal de detalle de solicitud desde el Kanban": "03-kanban-detalle.png",
    "Listado de solicitudes con buscador y filtros": "04-solicitudes.png",
    "Formulario de nueva solicitud con sus pestañas": "05-solicitud-nueva.png",
    "Vista de detalle con cambiar estado, personal y recursos": "06-solicitud-detalle.png",
    "Calendario en vista de mes con eventos": "07-calendario-mes.png",
    "Modal de detalle de actividad desde el calendario": "08-calendario-detalle.png",
    "Centro de notificaciones con filtros": "09-notificaciones.png",
    "Listado de solicitantes con buscador y paginación": "10-solicitantes.png",
    "Listado de usuarios registrados": "11-usuarios.png",
    "Listado de recursos": "12-recursos.png",
    "Configuración (pestaña de catálogo)": "13-configuracion.png",
    "Dashboard de reportes con tarjetas KPI y gráfica": "14-reportes.png",
}
NUM_FIGURA = 0

# ---------------------------------------------------------------- colores
NAVY = RGBColor(0x1F, 0x38, 0x64)
BLUE = RGBColor(0x2E, 0x5B, 0xA6)
GRAY = RGBColor(0x59, 0x59, 0x59)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
RED = RGBColor(0xC0, 0x00, 0x00)
GREEN = RGBColor(0x2E, 0x7D, 0x32)

HDR_FILL = "1F3864"      # tabla: encabezado azul marino
ALT_FILL = "D9E2F3"      # tabla: fila alterna azul claro
BOX_FILL = "F2F2F2"      # caja de captura placeholder
NOTE_FILL = "FFF2CC"     # nota amarilla
ROLE_FILL = "E2EFDA"     # nota de rol verde claro


def shade(cell, fill):
    """Aplica color de fondo a una celda."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:fill"), fill)
    tcPr.append(shd)


def cell_text(cell, text, bold=False, color=None, size=10, align=None):
    cell.text = ""
    p = cell.paragraphs[0]
    if align is not None:
        p.alignment = align
    run = p.add_run(text)
    run.bold = bold
    run.font.size = Pt(size)
    if color:
        run.font.color.rgb = color
    return p


def add_table(doc, headers, rows, widths=None, zebra=True):
    """Tabla con encabezado azul marino y filas alternas."""
    t = doc.add_table(rows=1 + len(rows), cols=len(headers))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(headers):
        c = t.rows[0].cells[i]
        shade(c, HDR_FILL)
        cell_text(c, h, bold=True, color=WHITE, size=10)
    for r, row in enumerate(rows):
        for i, val in enumerate(row):
            c = t.rows[r + 1].cells[i]
            if zebra and r % 2 == 1:
                shade(c, ALT_FILL)
            cell_text(c, str(val), size=10)
    if widths:
        for row in t.rows:
            for i, w in enumerate(widths):
                row.cells[i].width = Cm(w)
    doc.add_paragraph()
    return t


def add_placeholder(doc, text):
    """Inserta la captura real si existe; si no, caja gris de respaldo."""
    global NUM_FIGURA
    fname = CAPTURAS.get(text)
    fpath = os.path.join(CAPTURAS_DIR, fname) if fname else None
    if fpath and os.path.exists(fpath):
        NUM_FIGURA += 1
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run()
        run.add_picture(fpath, width=Cm(16))
        cap = doc.add_paragraph()
        cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        rc = cap.add_run(f"Figura {NUM_FIGURA}. {text}")
        rc.italic = True
        rc.font.size = Pt(9)
        rc.font.color.rgb = GRAY
        doc.add_paragraph()
        return
    t = doc.add_table(rows=1, cols=1)
    t.style = "Table Grid"
    c = t.rows[0].cells[0]
    shade(c, BOX_FILL)
    c.text = ""
    p = c.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("[ CAPTURA PENDIENTE ]\n" + text)
    run.italic = True
    run.font.size = Pt(10)
    run.font.color.rgb = GRAY
    c.width = Cm(16)
    doc.add_paragraph()


def add_note(doc, text, kind="nota"):
    """Caja de nota: nota (amarillo) o rol (verde)."""
    fill = NOTE_FILL if kind == "nota" else ROLE_FILL
    label = "NOTA: " if kind == "nota" else "POR ROL: "
    t = doc.add_table(rows=1, cols=1)
    t.style = "Table Grid"
    c = t.rows[0].cells[0]
    shade(c, fill)
    c.text = ""
    p = c.paragraphs[0]
    run = p.add_run(label)
    run.bold = True
    run.font.size = Pt(10)
    run2 = p.add_run(text)
    run2.font.size = Pt(10)
    c.width = Cm(16)
    doc.add_paragraph()


def _next_num_id(numbering):
    ids = [int(n.get(qn("w:numId"))) for n in numbering.findall(qn("w:num"))]
    return max(ids) + 1 if ids else 1


def _new_restartable_num(doc, abstract_id=7):
    """Crea una instancia de numeracion (numId nuevo) que reinicia en 1."""
    numbering = doc.part.numbering_part.element
    nid = _next_num_id(numbering)
    num = OxmlElement("w:num")
    num.set(qn("w:numId"), str(nid))
    abs_ref = OxmlElement("w:abstractNumId")
    abs_ref.set(qn("w:val"), str(abstract_id))
    num.append(abs_ref)
    override = OxmlElement("w:lvlOverride")
    override.set(qn("w:ilvl"), "0")
    start = OxmlElement("w:startOverride")
    start.set(qn("w:val"), "1")
    override.append(start)
    num.append(override)
    numbering.append(num)
    return nid


def add_steps(doc, steps):
    """Lista numerada real de Word: cada lista reinicia en 1."""
    nid = _new_restartable_num(doc)
    for s in steps:
        p = doc.add_paragraph()
        pPr = p._p.get_or_add_pPr()
        numPr = OxmlElement("w:numPr")
        ilvl = OxmlElement("w:ilvl")
        ilvl.set(qn("w:val"), "0")
        numPr.append(ilvl)
        numId_el = OxmlElement("w:numId")
        numId_el.set(qn("w:val"), str(nid))
        numPr.append(numId_el)
        pPr.append(numPr)
        run = p.add_run(s)
        run.font.size = Pt(11)
        p.paragraph_format.space_after = Pt(4)


def add_bullets(doc, items):
    for s in items:
        p = doc.add_paragraph(s, style="List Bullet")
        p.paragraph_format.space_after = Pt(2)


def body(doc, text, bold=False, italic=False):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = bold
    run.italic = italic
    run.font.size = Pt(11)
    return p


def h1(doc, text):
    doc.add_heading(text, level=1)


def h2(doc, text):
    doc.add_heading(text, level=2)


def h3(doc, text):
    doc.add_heading(text, level=3)


# ================================================================ documento
doc = Document()

# estilos base
style = doc.styles["Normal"]
style.font.name = "Calibri"
style.font.size = Pt(11)
for lvl, sz in ((1, 16), (2, 13), (3, 12)):
    hs = doc.styles[f"Heading {lvl}"]
    hs.font.name = "Calibri"
    hs.font.size = Pt(sz)
    hs.font.color.rgb = NAVY

# márgenes
for section in doc.sections:
    section.top_margin = Cm(2)
    section.bottom_margin = Cm(2)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.5)

# ---------------------------------------------------------------- portada
for _ in range(4):
    doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("MUNICIPALIDAD DE SANTIAGO ATITLÁN")
run.bold = True
run.font.size = Pt(14)
run.font.color.rgb = NAVY

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("DIRECCIÓN DE COMUNICACIÓN SOCIAL")
run.bold = True
run.font.size = Pt(12)
run.font.color.rgb = BLUE

doc.add_paragraph()

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("MANUAL DE USUARIOS")
run.bold = True
run.font.size = Pt(28)
run.font.color.rgb = NAVY

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("Sistema de Gestión Operativa\nde Comunicación Social")
run.font.size = Pt(16)
run.font.color.rgb = GRAY

for _ in range(4):
    doc.add_paragraph()

info = [
    ("Versión", "1.0"),
    ("Fecha de elaboración", date.today().strftime("%d de %B de %Y").replace("January", "enero")
     .replace("February", "febrero").replace("March", "marzo").replace("April", "abril")
     .replace("May", "mayo").replace("June", "junio").replace("July", "julio")
     .replace("August", "agosto").replace("September", "septiembre")
     .replace("October", "octubre").replace("November", "noviembre").replace("December", "diciembre")),
    ("Dirigido a", "Administradores, Directores de Dependencia y Lectores"),
    ("Ámbito", "Dirección de Comunicación Social"),
]
t = doc.add_table(rows=len(info), cols=2)
t.alignment = WD_TABLE_ALIGNMENT.CENTER
for i, (k, v) in enumerate(info):
    cell_text(t.rows[i].cells[0], k, bold=True, size=11, color=NAVY)
    cell_text(t.rows[i].cells[1], v, size=11)
    t.rows[i].cells[0].width = Cm(5)
    t.rows[i].cells[1].width = Cm(9)

doc.add_page_break()

# ---------------------------------------------------------------- índice
h1(doc, "Índice")
indice = [
    "1. Introducción",
    "2. Descripción general del sistema",
    "3. Requisitos previos y acceso",
    "4. Inicio de sesión",
    "5. Interfaz principal (Inicio)",
    "6. Roles y permisos",
    "7. Módulo Kanban",
    "8. Módulo Solicitudes",
    "9. Ciclo de vida de una solicitud",
    "10. Módulo Calendario",
    "11. Módulo Notificaciones",
    "12. Módulo Solicitantes",
    "13. Módulo Usuarios",
    "14. Módulo Recursos",
    "15. Módulo Configuración",
    "16. Módulo Reportes",
    "17. Preguntas frecuentes y solución de problemas",
    "Anexo A. Matriz detallada de permisos",
    "Anexo B. Catálogos del sistema",
    "Anexo C. Glosario",
]
for item in indice:
    p = doc.add_paragraph(item)
    p.paragraph_format.space_after = Pt(2)

doc.add_page_break()

# ================================================================ 1
h1(doc, "1. Introducción")
body(doc, "El presente manual describe el uso del Sistema de Gestión Operativa de "
          "Comunicación Social, desarrollado para la Municipalidad de Santiago Atitlán con "
          "el propósito de digitalizar y ordenar el flujo de trabajo de la Dirección de "
          "Comunicación Social: el registro de solicitudes de servicios, su seguimiento "
          "mediante un tablero Kanban, su programación en un calendario, el control de "
          "personal y recursos asignados, así como la generación de reportes estadísticos.")
body(doc, "Este manual está dirigido a todos los usuarios del sistema, sin importar su rol. "
          "Cada módulo indica de forma clara qué acciones están disponibles para cada perfil "
          "de usuario. Al final se incluyen anexos con la matriz completa de permisos, los "
          "catálogos del sistema y un glosario de términos.")
body(doc, "Contenido del manual:")
add_bullets(doc, [
    "Secciones 1 a 6: aspectos generales, acceso y permisos.",
    "Secciones 7 a 16: descripción detallada de cada módulo del sistema.",
    "Sección 17: preguntas frecuentes y solución de problemas comunes.",
    "Anexos A, B y C: referencia rápida de permisos, catálogos y glosario.",
])

# ================================================================ 2
h1(doc, "2. Descripción general del sistema")
body(doc, "El sistema es una aplicación web conformada por dos partes:")
add_bullets(doc, [
    "Frontend (interfaz de usuario): página web que se ejecuta en el navegador en la dirección http://localhost:4200.",
    "Backend (servidor de datos): servicio que procesa las peticiones y se comunica con la base de datos en http://localhost:3000.",
])
body(doc, "Módulos disponibles:")
add_table(doc, ["Módulo", "Función principal", "Disponible para"], [
    ["Kanban", "Tablero visual para seguir el avance de las solicitudes por etapa", "Todos los roles"],
    ["Solicitudes", "Registro, edición y gestión de solicitudes de servicios", "Todos (gestión: solo admin)"],
    ["Calendario", "Vista de las actividades programadas por fecha", "Todos los roles"],
    ["Notificaciones", "Avisos de asignaciones, cambios de estado y fechas", "Todos los roles"],
    ["Solicitantes", "Gestión de personas e instituciones que solicitan servicios", "Solo administrador"],
    ["Usuarios", "Alta y administración de cuentas de acceso", "Solo administrador"],
    ["Recursos", "Inventario de equipos y recursos disponibles", "Todos (gestión: solo admin)"],
    ["Configuración", "Perfil de usuario, catálogos y respaldo de base de datos", "Todos (varía por rol)"],
    ["Reportes", "Estadísticas, carga de trabajo y exportación a PDF", "Solo administrador"],
], widths=[3.5, 8.5, 4])

# ================================================================ 3
h1(doc, "3. Requisitos previos y acceso")
h2(doc, "3.1 Requisitos técnicos")
add_bullets(doc, [
    "Computadora con conexión a la red de la Municipalidad.",
    "Navegador web actualizado: Google Chrome, Microsoft Edge o Mozilla Firefox (versiones recientes).",
    "Resolución de pantalla recomendada: 1366 x 768 o superior.",
])
h2(doc, "3.2 Direcciones de acceso")
add_table(doc, ["Componente", "Dirección", "Observación"], [
    ["Aplicación web", "http://localhost:4200", "Se abre en el navegador; redirige automáticamente al inicio de sesión"],
    ["Servidor de datos", "http://localhost:3000/api", "No se usa directamente; lo utiliza el sistema automáticamente"],
], widths=[4, 6, 6])
add_note(doc, "El sistema debe estar encendido en el servidor de la oficina. Si la página "
              "no carga, verifique que la computadora tenga conexión a la red y contacte "
              "al área de soporte (sección 17).")

# ================================================================ 4
h1(doc, "4. Inicio de sesión")
body(doc, "Toda consulta al sistema comienza en la pantalla de inicio de sesión.")
h2(doc, "4.1 Pasos para iniciar sesión")
add_steps(doc, [
    "Abra el navegador y escriba la dirección http://localhost:4200 y presione Enter.",
    "Se mostrará la pantalla de inicio de sesión con el logotipo de la Municipalidad de Santiago Atitlán.",
    "En el campo Usuario escriba su nombre de usuario asignado.",
    "En el campo Contraseña escriba su contraseña.",
    "Presione el botón Iniciar Sesión.",
    "Si los datos son correctos, el sistema lo llevará al Tablero Kanban.",
])
add_placeholder(doc, "Pantalla de inicio de sesión completa")
h2(doc, "4.2 Datos de acceso")
add_bullets(doc, [
    "Su nombre de usuario y contraseña le fueron asignados por el administrador del sistema (módulo Usuarios).",
    "La contraseña no distingue mayúsculas de minúsculas únicamente si así fue configurada; escríbala tal cual fue entregada.",
    "Si olvidó su contraseña, contacte al administrador del sistema; no existe un formulario de recuperación automática.",
])
h2(doc, "4.3 Duración de la sesión")
body(doc, "La sesión permanece activa durante 8 horas. Al vencer ese tiempo, el sistema "
          "solicitará iniciar sesión nuevamente. Si cierra el navegador sin usar el botón "
          "Cerrar sesión, se recomienda cerrar la sesión antes de abandonar la computadora "
          "para evitar accesos no autorizados.")
h2(doc, "4.4 Cerrar sesión")
add_steps(doc, [
    "En el menú lateral izquierdo, presione el botón Cerrar sesión (último elemento del menú).",
    "El sistema lo regresará a la pantalla de inicio de sesión.",
])
add_note(doc, "Nunca comparta su contraseña. Cada usuario es responsable de las "
              "acciones realizadas con su cuenta.")

# ================================================================ 5
h1(doc, "5. Interfaz principal (Inicio)")
body(doc, "Al iniciar sesión se muestra el sistema con un menú lateral izquierdo "
          "permanente y el área de contenido a la derecha.")
add_placeholder(doc, "Interfaz principal con menú lateral visible")
h2(doc, "5.1 Elementos del menú lateral")
add_table(doc, ["Elemento", "Función", "Visibilidad"], [
    ["Logotipo / Municipalidad de Santiago Atitlán", "Regresa al Tablero Kanban", "Todos"],
    ["Kanban", "Tablero de seguimiento de solicitudes", "Todos"],
    ["Solicitudes", "Gestión de solicitudes de servicios", "Todos"],
    ["Calendario", "Vista de actividades por fecha", "Todos"],
    ["Notificaciones", "Centro de avisos (muestra contador de no leídas)", "Todos"],
    ["Solicitantes", "Gestión de personas e instituciones solicitantes", "Solo administrador"],
    ["Usuarios", "Gestión de cuentas de acceso", "Solo administrador"],
    ["Reportes", "Estadísticas y exportación de información", "Solo administrador"],
    ["Recursos", "Inventario de equipos y recursos", "Todos"],
    ["Configuración", "Perfil, catálogos y respaldo", "Todos"],
    ["Cerrar sesión", "Cierra la sesión y regresa al inicio", "Todos"],
], widths=[6, 6.5, 3.5])
h2(doc, "5.2 Indicador de notificaciones")
body(doc, "Junto al menú Notificaciones aparece un número azul que indica cuántas "
          "notificaciones sin leer tiene. El contador se actualiza automáticamente cada "
          "pocos segundos. El valor máximo mostrado es 99+.")
h2(doc, "5.3 Comportamiento móvil / pantalla pequeña")
body(doc, "En pantallas estrechas, el menú lateral puede ocultarse y desplegarse "
          "mediante el botón de tres líneas (☰) situado en la esquina superior izquierda.")

# ================================================================ 6
h1(doc, "6. Roles y permisos")
body(doc, "Cada cuenta de usuario tiene un rol que define qué puede hacer dentro del "
          "sistema. Los roles vigentes son:")
add_table(doc, ["Rol", "Descripción"], [
    ["Administrador", "Acceso total. Gestiona usuarios, solicitantes, solicitudes, recursos, catálogos, reportes y respaldos."],
    ["Desarrollador", "Cuenta técnica de respaldo con los mismos permisos que el Administrador. Existe para rescate de cuentas."],
    ["Director de Dependencia", "Acceso de consulta. Puede ver solicitudes, kanban, calendario, notificaciones y su perfil, pero no modificar información operativa."],
    ["Lector", "Acceso de solo consulta, idéntico al Director de Dependencia en la versión actual."],
], widths=[4.5, 11.5])
h2(doc, "6.1 Matriz resumen de permisos")
add_table(doc, ["Funcionalidad", "Administrador", "Desarrollador", "Director / Lector"], [
    ["Ver Kanban, Solicitudes, Calendario, Notificaciones, Recursos", "Sí", "Sí", "Sí"],
    ["Crear / editar / eliminar solicitudes", "Sí", "Sí", "No"],
    ["Cambiar estado de solicitudes (kanban o detalle)", "Sí", "Sí", "No"],
    ["Asignar personal y recursos a una solicitud", "Sí", "Sí", "No"],
    ["Gestionar Solicitantes e instituciones", "Sí", "Sí", "No"],
    ["Gestionar Usuarios", "Sí", "Sí", "No"],
    ["Gestionar Recursos y tipos de recurso", "Sí", "Sí", "No"],
    ["Ver y generar Reportes, exportar PDF", "Sí", "Sí", "No"],
    ["Modificar catálogos del sistema", "Sí", "Sí", "No (solo consulta)"],
    ["Generar respaldo de la base de datos", "Sí", "Sí", "No"],
    ["Editar su propio perfil", "Sí", "Sí", "Sí"],
], widths=[7.5, 3, 3, 2.5])
add_note(doc, "Si ciertas opciones no aparecen en su pantalla (botones, menús o "
              "pestañas), es porque su rol no tiene permiso sobre ellas. Esto es "
              "comportamiento normal del sistema, no un error.", kind="rol")

# ================================================================ 7
doc.add_page_break()
h1(doc, "7. Módulo Kanban")
body(doc, "El Tablero Kanban es la pantalla inicial del sistema. Muestra todas las "
          "solicitudes organizadas en columnas según su estado de avance, permitiendo "
          "visualizar de un vistazo el trabajo de la Dirección.")
add_placeholder(doc, "Tablero Kanban con sus 5 columnas y tarjetas")
h2(doc, "7.1 Partes del tablero")
add_table(doc, ["Elemento", "Descripción"], [
    ["Encabezado", "Título Tablero Kanban y fecha larga del día (ej. Lunes, 12 de octubre de 2026)."],
    ["Botón + Nueva solicitud", "Solo visible para administradores. Abre el formulario de nueva solicitud."],
    ["Columnas", "Una por cada estado de actividad: REVISIÓN, AUTORIZADO, EN PROCESO, FINALIZADO y CANCELADO."],
    ["Contador por columna", "Círculo con el número de solicitudes en esa etapa."],
    ["Tarjetas", "Cada solicitud aparece como una tarjeta dentro de su columna."],
], widths=[5, 11])
h2(doc, "7.2 Información de cada tarjeta")
add_bullets(doc, [
    "No. número de solicitud.",
    "Prioridad (texto) y franja de color en la parte superior: Urgente = rojo, Alta = naranja, Media = azul, Baja = gris.",
    "Nombre de la actividad.",
    "Responsable asignado (o el texto Sin asignar).",
    "Lugar de la actividad (o Sin lugar).",
    "Rango de fechas (inicio – fin) y horario.",
    "Franja lateral izquierda del color de la columna de estado.",
])
h2(doc, "7.3 Acciones disponibles")
h3(doc, "Colapsar / expandir columnas")
body(doc, "Presione el encabezado de una columna para contraerla o volver a expandirla. "
          "Útil para enfocarse en una sola etapa.")
h3(doc, "Ver detalle de una solicitud")
add_steps(doc, [
    "Presione cualquier tarjeta.",
    "Se abrirá una ventana (modal) con la información completa: actividad, descripción, estado, prioridad, fechas, horario, lugar, solicitante, personal asignado y recursos asignados.",
    "Presione Cerrar para salir del modal.",
])
add_placeholder(doc, "Modal de detalle de solicitud desde el Kanban")
h3(doc, "Mover solicitudes de columna (solo administrador)")
add_steps(doc, [
    "Con el mouse, arrastre una tarjeta y suéltela sobre la columna de destino.",
    "El sistema cambiará el estado de la solicitud y lo registrará en el historial con la observación Cambio desde tablero Kanban (arrastre).",
    "Se mostrará un mensaje de confirmación con el nuevo estado.",
    "Las personas asignadas a la solicitud recibirán una notificación del cambio.",
])
add_note(doc, "El arrastre de tarjetas solo funciona para los roles Administrador y "
              "Desarrollador. Para los demás roles las tarjetas no se pueden mover.", kind="rol")
h3(doc, "Editar una solicitud (solo administrador)")
add_steps(doc, [
    "Abra la tarjeta y presione Editar en la parte inferior del modal.",
    "Se abrirá el formulario de edición con pestañas: Datos de la Actividad, Solicitante, Responsable(s), Recursos, Estado y Prioridad.",
    "Realice los cambios y presione Guardar.",
    "Presione Cerrar para salir del modal de detalle.",
])
h2(doc, "7.4 Retención de solicitudes finalizadas")
body(doc, "Las solicitudes en estado FINALIZADO permanecen en el tablero durante 7 días "
          "a partir de su fecha de finalización; después de ese tiempo dejan de mostrarse "
          "en el Kanban, pero su información sigue disponible en Solicitudes, Calendario "
          "y Reportes.")

# ================================================================ 8
doc.add_page_break()
h1(doc, "8. Módulo Solicitudes")
body(doc, "El módulo Solicitudes es el registro central del sistema. Permite crear, "
          "editar, consultar y eliminar las solicitudes de servicios que recibe la "
          "Dirección de Comunicación Social.")
add_placeholder(doc, "Listado de solicitudes con buscador y filtros")
h2(doc, "8.1 Consultar solicitudes")
add_bullets(doc, [
    "El listado muestra: Actividad, Solicitante, Fecha (rango), Estado, Responsable y Opciones.",
    "Use el campo Buscar por actividad, solicitante o responsable... para filtrar por texto (también busca en descripción, lugar y estado).",
    "Use el menú Todos los estados para filtrar por una etapa específica.",
    "La paginación inferior permite navegar entre páginas (« Anterior / Siguiente »).",
])
h2(doc, "8.2 Crear una nueva solicitud (solo administrador)")
add_steps(doc, [
    "Ingrese al módulo Solicitudes desde el menú lateral.",
    "Presione el botón + Nueva solicitud (también puede usar el botón homólogo del Kanban).",
    "Complete las pestañas del formulario:",
])
add_table(doc, ["Pestaña", "Campos"], [
    ["Datos de la Actividad", "Nombre de la actividad*, Fecha de creación, Fecha de actividad*, Fecha fin de actividad*, Hora inicio, Hora fin (Aproximada), Lugar, Descripción"],
    ["Solicitante", "Selección de la persona o institución solicitante* (menú desplegable)"],
    ["Responsable(s)", "Tabla de usuarios con casillas de verificación; seleccione una o varias personas responsables"],
    ["Recursos", "Tabla de recursos con casillas de verificación; seleccione los equipos necesarios"],
    ["Estado y Prioridad", "Seleccionar estado* y Seleccionar prioridad*"],
], widths=[4.5, 11.5])
add_steps(doc, [
    "Presione Guardar.",
    "El sistema validará los campos obligatorios (marcados con *). Si falta algún dato, se resaltará el campo y se indicará la pestaña a corregir.",
    "Al guardar correctamente, la solicitud aparecerá en el listado, en el Kanban y en el Calendario.",
])
add_placeholder(doc, "Formulario de nueva solicitud con sus pestañas")
add_note(doc, "La fecha fin de actividad no puede ser anterior a la fecha de actividad. "
              "El sistema mostrará el mensaje La fecha fin no puede ser anterior a la fecha "
              "de actividad si se infringe esta regla.")
h2(doc, "8.3 Editar una solicitud (solo administrador)")
add_steps(doc, [
    "En el listado, presione el ícono de lápiz (Editar) en la fila de la solicitud.",
    "Modifique los datos en las pestañas del formulario.",
    "Presione Guardar.",
    "Si cambió fechas, hora o lugar, las personas asignadas recibirán una notificación de Cambio de fecha.",
    "Si cambió el estado, el sistema lo registrará en el historial.",
])
h2(doc, "8.4 Ver detalle y gestionar una solicitud")
add_steps(doc, [
    "En el listado, presione el ícono del ojo (Ver detalle).",
    "Se mostrará una ficha con: Solicitante, Lugar, Fecha, Horario, Estado, Prioridad y Fecha de creación.",
])
h3(doc, "Cambiar estado (solo administrador)")
add_bullets(doc, [
    "En la sección Cambiar estado aparecen los botones de cada etapa: REVISIÓN, AUTORIZADO, EN PROCESO, FINALIZADO y CANCELADO.",
    "Presione el estado de destino. El estado actual aparece resaltado.",
    "El cambio se registra en el historial y genera notificaciones para las personas asignadas.",
])
h3(doc, "Asignar o quitar personal (solo administrador)")
add_steps(doc, [
    "En la sección Personal asignado, seleccione un usuario en el menú (mostrado como usuario - rol).",
    "Presione Asignar.",
    "Para retirar a alguien, presione Quitar en la fila correspondiente.",
    "El personal asignado recibe una notificación de Solicitud asignada.",
])
h3(doc, "Asignar o quitar recursos (solo administrador)")
add_steps(doc, [
    "En la sección Recursos asignados, seleccione un recurso en el menú (mostrado como nombre (tipo)).",
    "Presione Asignar.",
    "Para retirarlo, presione Quitar en la fila correspondiente.",
])
add_placeholder(doc, "Vista de detalle con cambiar estado, personal y recursos")
h2(doc, "8.5 Eliminar una solicitud (solo administrador)")
add_steps(doc, [
    "Presione el ícono de papelera (Eliminar) en la fila de la solicitud.",
    "Confirme en el mensaje Esta seguro de eliminar esta solicitud?.",
    "La solicitud y sus asignaciones, notificaciones y registros relacionados se eliminan de forma permanente.",
])
add_note(doc, "La eliminación no se puede deshacer. Verifique que realmente desea "
              "eliminar la solicitud antes de confirmar.")

# ================================================================ 9
doc.add_page_break()
h1(doc, "9. Ciclo de vida de una solicitud")
body(doc, "Toda solicitud atraviesa una serie de estados hasta su cierre. Este flujo es "
          "la base del trabajo de la Dirección de Comunicación Social.")
h2(doc, "9.1 Estados del flujo")
add_table(doc, ["Orden", "Estado", "Significado"], [
    ["1", "REVISIÓN", "Solicitud recibida, pendiente de revisión por la Dirección."],
    ["2", "AUTORIZADO", "Solicitud revisada y autorizada para ejecutarse."],
    ["3", "EN PROCESO", "Actividad en ejecución por el personal asignado."],
    ["4", "FINALIZADO", "Actividad concluida satisfactoriamente."],
    ["5", "CANCELADO", "Actividad cancelada; no se ejecutará."],
], widths=[1.5, 4, 10.5])
h2(doc, "9.2 Cómo se produce cada cambio")
add_bullets(doc, [
    "Desde el Kanban: el administrador arrastra la tarjeta a la columna de destino.",
    "Desde el detalle de la solicitud: el administrador presiona el botón del estado de destino en la sección Cambiar estado.",
    "Desde la edición de la solicitud: al guardar con un estado diferente en la pestaña Estado y Prioridad.",
])
body(doc, "Cada cambio queda registrado en el historial de la solicitud con la fecha, "
          "el usuario que lo realizó, el estado anterior y el nuevo estado.")
h2(doc, "9.3 Notificaciones generadas")
add_table(doc, ["Evento", "Notificación recibida"], [
    ["Asignación de personal a una solicitud", "Solicitud asignada (con nombre, fecha, hora y lugar de la actividad)"],
    ["Cambio de estado a AUTORIZADO", "Solicitud autorizada"],
    ["Cambio de estado a CANCELADO", "Solicitud cancelada"],
    ["Cambio a otro estado (REVISIÓN, EN PROCESO, FINALIZADO)", "Cambio de estado"],
    ["Modificación de fechas, hora o lugar", "Cambio de fecha"],
], widths=[8, 8])
add_note(doc, "La persona que realiza el cambio no recibe la notificación de su propia "
              "acción; la reciben las demás personas asignadas a la solicitud.")

# ================================================================ 10
doc.add_page_break()
h1(doc, "10. Módulo Calendario")
body(doc, "El Calendario muestra las actividades programadas en tres vistas: por mes, "
          "por semana y por día. Las solicitudes de varios días aparecen en cada uno de "
          "los días de su rango.")
add_placeholder(doc, "Calendario en vista de mes con eventos")
h2(doc, "10.1 Controles del calendario")
add_table(doc, ["Control", "Función"], [
    ["Botón Hoy", "Regresa a la fecha actual."],
    ["Flechas ‹ ›", "Navega al mes, semana o día anterior/siguiente."],
    ["Título", "Muestra el mes y año, o la fecha en vista de día."],
    ["Botones Mes / Semana / Día", "Cambian la vista del calendario."],
    ["Leyenda de estados", "Puntos de color que identifican cada estado de actividad."],
], widths=[5.5, 10.5])
h2(doc, "10.2 Vista Mes")
add_bullets(doc, [
    "Cuadrícula de domingo a sábado.",
    "El día de hoy y el día seleccionado aparecen resaltados.",
    "Cada día muestra hasta 3 actividades coloreadas por estado; si hay más, aparece el texto +N mas.",
    "Presione un evento para ver su detalle; presione otro lugar del día para seleccionar ese día.",
])
h2(doc, "10.3 Vista Semana")
body(doc, "Muestra las 7 columnas de la semana seleccionada con todos los eventos de "
          "cada día, indicando la hora y el nombre de la actividad.")
h2(doc, "10.4 Vista Día")
body(doc, "Muestra el día completo con cada actividad indicando: rango de horas, "
          "nombre de la actividad, solicitante, estado (etiqueta con color) y prioridad. "
          "Si no hay actividades aparece el mensaje No hay actividades programadas para "
          "este dia.")
h2(doc, "10.5 Detalle y edición")
add_steps(doc, [
    "Presione un evento para abrir su ventana de detalle.",
    "El modal muestra: estado, actividad, solicitante, lugar, fechas, horario, fecha de creación y prioridad.",
    "Presione Cerrar para salir.",
    "Los administradores disponen del botón Editar, que abre el formulario de la solicitud en el módulo Solicitudes.",
])
add_placeholder(doc, "Modal de detalle de actividad desde el calendario")
add_note(doc, "No existe creación directa de solicitudes desde el calendario. Para crear "
              "una solicitud use el botón + Nueva solicitud del Kanban o del módulo "
              "Solicitudes.", kind="rol")

# ================================================================ 11
doc.add_page_break()
h1(doc, "11. Módulo Notificaciones")
body(doc, "El módulo Notificaciones centraliza los avisos del sistema: asignaciones, "
          "cambios de estado, autorizaciones, cancelaciones y cambios de fecha de las "
          "actividades en las que participa el usuario.")
add_placeholder(doc, "Centro de notificaciones con filtros")
h2(doc, "11.1 Tipos de notificación")
add_table(doc, ["Tipo", "Cuándo se genera"], [
    ["Solicitud asignada", "Cuando se le asigna como responsable de una solicitud."],
    ["Solicitud autorizada", "Cuando una solicitud pasa al estado AUTORIZADO."],
    ["Solicitud cancelada", "Cuando una solicitud pasa al estado CANCELADO."],
    ["Cambio de estado", "Cuando la solicitud cambia a otra etapa del flujo."],
    ["Cambio de fecha", "Cuando se modifican fechas, hora o lugar de una actividad."],
], widths=[4.5, 11.5])
h2(doc, "11.2 Uso del módulo")
add_steps(doc, [
    "Ingrese a Notificaciones desde el menú lateral.",
    "Use los filtros Todas (N) o No leidas (N) para alternar la vista.",
    "Presione una notificación para abrirla: se marcará como leída y lo llevará al módulo Solicitudes.",
    "Presione el ícono de palomita (✓) para marcar una notificación como leída.",
    "Presione la X para eliminar una notificación; confirme en el mensaje de verificación.",
    "Use el botón Marcar todas como leidas (N) para limpiar todas las pendientes de una vez.",
])
h2(doc, "11.3 Contador del menú")
body(doc, "El menú lateral Notificaciones muestra en tiempo real el número de avisos "
          "sin leer. El contador se actualiza automáticamente.")

# ================================================================ 12
doc.add_page_break()
h1(doc, "12. Módulo Solicitantes")
body(doc, "Este módulo administra las personas y las instituciones que solicitan "
          "servicios a la Dirección de Comunicación Social. Es de uso exclusivo de los "
          "roles Administrador y Desarrollador.")
add_placeholder(doc, "Listado de solicitantes con buscador y paginación")
h2(doc, "12.1 Registrar un nuevo solicitante")
add_steps(doc, [
    "Presione el botón + Nuevo solicitante.",
    "Complete el formulario:",
])
add_table(doc, ["Campo", "Descripción", "Obligatorio"], [
    ["Primer nombre", "Nombre propio del solicitante", "Sí"],
    ["Segundo nombre", "Segundo nombre (opcional)", "No"],
    ["Primer apellido", "Apellido del solicitante", "Sí"],
    ["Segundo apellido", "Segundo apellido (opcional)", "No"],
    ["Teléfono", "Número de contacto", "No"],
    ["Correo electrónico", "Correo de contacto", "No"],
    ["Institución", "Institución a la que pertenece (buscador) o Sin institución", "No"],
    ["Descripción", "Observaciones adicionales", "No"],
], widths=[4, 10, 2])
add_steps(doc, [
    "Presione Guardar.",
    "El solicitante quedará disponible en el formulario de solicitudes.",
])
h2(doc, "12.2 Registrar una nueva institución")
add_steps(doc, [
    "Presione el botón + Nueva institución.",
    "Complete el formulario rápido: Nombre de la institución* (ej. Municipalidad de Santiago Atitlán), Representante, Tel. representante, Tel. institución, Correo electrónico, Dirección y Descripción.",
    "Presione Guardar.",
    "La institución creada se seleccionará automáticamente en el formulario de solicitante.",
])
h2(doc, "12.3 Buscar, editar y eliminar")
add_bullets(doc, [
    "Búsqueda: escriba en el campo Buscar por nombre o institucion...; el filtro coincide con cualquier parte del nombre o la institución.",
    "Editar: presione el ícono de lápiz, modifique los datos y presione Guardar.",
    "Eliminar: presione el ícono de papelera y confirme en Esta seguro de eliminar este solicitante?.",
    "Paginación: 10 registros por página con botones « Anterior, números y Siguiente ».",
])

# ================================================================ 13
doc.add_page_break()
h1(doc, "13. Módulo Usuarios")
body(doc, "El módulo Usuarios administra las cuentas de acceso al sistema: datos "
          "personales, información laboral y credenciales de ingreso. Uso exclusivo de "
          "Administrador y Desarrollador.")
add_placeholder(doc, "Listado de usuarios registrados")
h2(doc, "13.1 Crear un nuevo usuario")
add_steps(doc, [
    "Presione el botón + Nuevo usuario.",
    "Complete las tres secciones del formulario:",
])
add_table(doc, ["Sección", "Campos"], [
    ["Datos personales", "Primer nombre, Segundo nombre, Primer apellido, Segundo apellido, DPI, Teléfono, Correo electrónico"],
    ["Información laboral", "Tipo de empleado (menú), Cargo (menú)"],
    ["Cuenta de acceso", "Nombre de usuario, Contraseña (con botón de mostrar/ocultar), Rol (menú), Estado (menú)"],
], widths=[4.5, 11.5])
add_steps(doc, [
    "Presione Guardar usuario.",
    "La contraseña se almacena de forma segura (encriptada); ni siquiera el administrador puede verla después de guardada.",
])
h2(doc, "13.2 Editar un usuario")
add_steps(doc, [
    "En la tabla Usuarios registrados, presione el ícono de lápiz de la fila a modificar.",
    "Cambie los datos necesarios; para cambiar la contraseña escriba una nueva en el campo Correspondiente.",
    "Para desactivar el acceso, cambie el Estado a INACTIVO en la sección Cuenta de acceso.",
    "Presione Guardar usuario.",
])
h2(doc, "13.3 Cuenta protegida del desarrollador")
add_note(doc, "Las cuentas con rol Desarrollador no pueden ser modificadas ni eliminadas "
              "por un administrador normal; solo otro usuario con rol Desarrollador "
              "puede hacerlo. El sistema muestra Cuenta protegida: solo un desarrollador "
              "puede modificarla al intentar editarlas.", kind="rol")
h2(doc, "13.4 Estados de cuenta")
add_bullets(doc, [
    "ACTIVO: puede iniciar sesión y trabajar con normalidad.",
    "INACTIVO: no podrá iniciar sesión; útil para personal que deja la Dirección.",
    "Otros estados del catálogo (EN LÍNEA, EN PAUSA) están disponibles según la configuración de la institución.",
])

# ================================================================ 14
doc.add_page_break()
h1(doc, "14. Módulo Recursos")
body(doc, "El módulo Recursos administra el inventario de equipos disponibles para las "
          "actividades: cámaras, micrófonos, laptops, etc. Todos los roles pueden ver el "
          "listado; solo Administrador y Desarrollador pueden modificarlo.")
add_placeholder(doc, "Listado de recursos")
h2(doc, "14.1 Campos de un recurso")
add_table(doc, ["Campo", "Descripción"], [
    ["Nombre del recurso*", "Nombre del equipo (ej. Cámara Canon EOS)."],
    ["Tipo de recurso*", "Categoría del equipo (Equipo Fotográfico, Equipo de Video, Equipo de Audio, Equipo Informático)."],
    ["Estado", "Disponible, En uso o Mantenimiento."],
    ["Descripción", "Detalles adicionales del recurso."],
], widths=[4.5, 11.5])
h2(doc, "14.2 Crear un recurso (solo administrador)")
add_steps(doc, [
    "Presione el botón + Nuevo recurso.",
    "Escriba el nombre del recurso.",
    "Seleccione el tipo de recurso en el menú.",
    "Si el tipo no existe, presione + Nuevo tipo, complete Nombre del tipo y Descripción, y presione Guardar tipo; el nuevo tipo quedará seleccionado automáticamente.",
    "Seleccione el estado del recurso.",
    "Agregue una descripción si lo desea y presione Guardar.",
])
h2(doc, "14.3 Editar y eliminar")
add_bullets(doc, [
    "Editar: presione el lápiz de la fila, modifique los datos y presione Guardar.",
    "Eliminar: presione la papelera y confirme en Esta seguro de eliminar este recurso?.",
    "Los recursos asignados a una solicitud aparecerán en el detalle de la misma.",
])

# ================================================================ 15
doc.add_page_break()
h1(doc, "15. Módulo Configuración")
body(doc, "El módulo Configuración contiene la gestión del perfil de usuario, los "
          "catálogos del sistema y el respaldo de la base de datos. Las pestañas "
          "disponibles varían según el rol.")
add_table(doc, ["Pestaña", "Disponible para", "Permisos"], [
    ["Perfil", "Todos los roles", "Todos pueden ver su perfil; edición según rol (ver 15.1)"],
    ["Base de Datos", "Administrador y Desarrollador", "Generar respaldo de la base de datos"],
    ["Estados de Actividad", "Administrador (CRUD), Director/Lector (solo consulta)", "Gestión del catálogo de estados"],
    ["Prioridades", "Administrador (CRUD), Director/Lector (solo consulta)", "Gestión del catálogo de prioridades"],
    ["Cargos", "Administrador (CRUD), Director/Lector (solo consulta)", "Gestión del catálogo de cargos"],
    ["Roles", "Administrador (CRUD), Director/Lector (solo consulta)", "Gestión del catálogo de roles"],
    ["Tipos de Empleado", "Administrador (CRUD), Director/Lector (solo consulta)", "Gestión del catálogo de tipos de empleado"],
    ["Estados de Usuario", "Administrador (CRUD), Director/Lector (solo consulta)", "Gestión del catálogo de estados de cuenta"],
], widths=[4.5, 6.5, 5])
add_note(doc, "Los usuarios con rol Lector ven únicamente la pestaña Perfil.", kind="rol")
h2(doc, "15.1 Pestaña Perfil")
body(doc, "Muestra la información de la cuenta actual: Nombre de usuario, Nombre "
          "completo, Correo electrónico, Cargo, Rol y Estado.")
add_steps(doc, [
    "Presione el botón Editar (si su rol lo permite).",
    "Modifique: Nombre de usuario*, Primer nombre*, Segundo nombre, Primer apellido*, Segundo apellido y Correo electrónico.",
    "Presione Guardar.",
])
add_note(doc, "El botón Editar no está disponible para el rol que no puede modificar "
              "su perfil en la configuración actual.", kind="rol")
h2(doc, "15.2 Pestaña Base de Datos (solo administrador)")
body(doc, "Permite generar un respaldo (backup) completo de la información del sistema "
          "en un archivo de texto con extensión .sql.")
add_steps(doc, [
    "Ingrese a Configuración y seleccione la pestaña Base de Datos.",
    "Presione el botón Generar backup (durante el proceso mostrará Generando backup...).",
    "Espere unos segundos: el archivo se descargará automáticamente con el nombre backup_gestion_comunicacion_social_fecha_hora.sql y también se guardará en el servidor.",
])
add_note(doc, "Guarde el archivo de respaldo en un lugar seguro (disco externo o "
              "unidad de red). Permite restaurar la información en caso de pérdida de datos.")
h2(doc, "15.3 Pestañas de catálogos")
body(doc, "Las pestañas de catálogo (Estados de Actividad, Prioridades, Cargos, Roles, "
          "Tipos de Empleado y Estados de Usuario) funcionan de forma idéntica:")
add_steps(doc, [
    "Seleccione la pestaña del catálogo a gestionar.",
    "Se mostrarán los registros existentes con su contador.",
    "Administrador: presione + Nuevo, escriba el nombre en el campo indicado (ej. Nombre del cargo) y presione Guardar.",
    "Administrador: para modificar, presione el lápiz; para eliminar, presione la papelera y confirme.",
    "Director/Lector: pueden consultar la lista, pero los botones de edición no aparecen.",
])

# ================================================================ 16
doc.add_page_break()
h1(doc, "16. Módulo Reportes")
body(doc, "El módulo Reportes ofrece un panel de estadísticas de las solicitudes. "
          "Es de uso exclusivo de los roles Administrador y Desarrollador.")
add_placeholder(doc, "Dashboard de reportes con tarjetas KPI y gráfica")
h2(doc, "16.1 Indicadores generales (KPIs)")
add_table(doc, ["Tarjeta", "Significado"], [
    ["Total Solicitudes", "Cantidad total de solicitudes registradas."],
    ["Pendientes", "Solicitudes en estado REVISIÓN."],
    ["En Proceso", "Solicitudes en estado EN PROCESO."],
    ["Finalizados", "Solicitudes en estado FINALIZADO."],
], widths=[5, 11])
h2(doc, "16.2 Carga de trabajo por usuario")
body(doc, "Gráfica de barras que muestra las asignaciones del mes por persona. Use las "
          "flechas ‹ › junto al nombre del mes para navegar entre meses.")
h2(doc, "16.3 Actividades por trabajador")
add_steps(doc, [
    "Despliegue la sección Actividades por Trabajador (acordeón con contador).",
    "Use el campo Buscar trabajador... para localizar personal específico.",
    "Cada trabajador muestra su nombre, cargo y cantidad de actividades; presiónelo para desplegar la tabla con: número, actividad, fecha, lugar, estado, prioridad y solicitante.",
])
h2(doc, "16.4 Reporte por rango de fechas y exportación a PDF")
add_steps(doc, [
    "En la sección Reporte por Rango de Fechas, seleccione un filtro rápido: Hoy, Esta Semana, Este Mes, Rango Personalizado (fechas de inicio y fin) o Por Estado (seleccione un estado).",
    "Presione Buscar (en los filtros de rango o estado).",
    "Se mostrará el texto Filtro activo: y la tabla de resultados.",
    "Presione ➔ Exportar PDF para descargar el reporte con formato (archivo reporte_solicitudes_fecha.pdf).",
])
add_note(doc, "El PDF solo se genera si hay datos para el filtro aplicado; de lo "
              "contrario el sistema mostrará el aviso No hay datos para exportar.")

# ================================================================ 17
doc.add_page_break()
h1(doc, "17. Preguntas frecuentes y solución de problemas")
add_table(doc, ["Situación", "Causa probable", "Solución"], [
    ["No puedo iniciar sesión; aparece un mensaje de error.",
     "Usuario o contraseña incorrectos, o cuenta INACTIVO.",
     "Verifique los datos escritos (sin espacios al final). Si la cuenta está inactiva, contacte al administrador."],
    ["La sesión se cerró solo.",
     "La sesión expira después de 8 horas por seguridad.",
     "Vuelva a iniciar sesión con sus credenciales."],
    ["No veo el botón + Nueva solicitud ni puedo editar.",
     "Su rol no tiene permisos de gestión (Director de Dependencia o Lector).",
     "Consulte la matriz de permisos de la sección 6. Solicite al administrador si necesita un rol con gestión."],
    ["No aparecen los módulos Usuarios, Solicitantes ni Reportes.",
     "Esos módulos son exclusivos del administrador.",
     "Contacte al administrador si requiere acceso a ellos."],
    ["No puedo mover las tarjetas del Kanban.",
     "El arrastre es exclusivo de Administrador y Desarrollador.",
     "Solicite al administrador el cambio de estado."],
    ["Una solicitud finalizada ya no aparece en el Kanban.",
     "Las solicitudes finalizadas se ocultan del tablero 7 días después de su cierre.",
     "Busque la solicitud en el módulo Solicitudes, el Calendario o los Reportes; allí sigue disponible."],
    ["No recibo notificaciones de asignaciones.",
     "Verifique que otro usuario realmente lo haya asignado a la solicitud.",
     "Revise el módulo Notificaciones y su correo registrado en el perfil."],
    ["Olvidé mi contraseña.",
     "No hay recuperación automática.",
     "Contacte al administrador del sistema para que la restablezca desde el módulo Usuarios."],
    ["La página no carga en el navegador.",
     "Servidor apagado o sin conexión de red.",
     "Verifique la conexión de red y contacte al área de soporte técnico."],
    ["Un colaborador se fue de la institución y sigue apareciendo.",
     "La cuenta no fue desactivada.",
     "El administrador debe editar la cuenta y cambiar el Estado a INACTIVO."],
], widths=[5, 5.5, 5.5])
body(doc, "Contacto para soporte del sistema:")
add_bullets(doc, [
    "Teléfono: 502 7721 7615",
    "Correo: atitlan.muni@gmail.com",
    "Facebook: MuniAtitlan",
    "Dirección de Comunicación Social - Municipalidad de Santiago Atitlán",
])

# ================================================================ Anexo A
doc.add_page_break()
h1(doc, "Anexo A. Matriz detallada de permisos")
body(doc, "Tabla completa de acciones y permisos por rol en cada módulo del sistema:")
add_table(doc, ["Módulo / Acción", "Administrador", "Desarrollador", "Director de Dependencia", "Lector"], [
    ["Iniciar sesión / cerrar sesión", "Sí", "Sí", "Sí", "Sí"],
    ["Ver Kanban y detalle de tarjetas", "Sí", "Sí", "Sí", "Sí"],
    ["Crear solicitud desde Kanban", "Sí", "Sí", "No", "No"],
    ["Arrastrar tarjetas (cambiar estado)", "Sí", "Sí", "No", "No"],
    ["Editar solicitud desde Kanban", "Sí", "Sí", "No", "No"],
    ["Ver listado de Solicitudes y filtros", "Sí", "Sí", "Sí", "Sí"],
    ["Crear / editar / eliminar solicitudes", "Sí", "Sí", "No", "No"],
    ["Cambiar estado desde detalle", "Sí", "Sí", "No", "No"],
    ["Asignar / quitar personal y recursos", "Sí", "Sí", "No", "No"],
    ["Ver Calendario (mes / semana / día)", "Sí", "Sí", "Sí", "Sí"],
    ["Editar actividad desde Calendario", "Sí", "Sí", "No", "No"],
    ["Usar Notificaciones (ver, leer, eliminar)", "Sí", "Sí", "Sí", "Sí"],
    ["Ver lista de Solicitantes", "Sí", "Sí", "No", "No"],
    ["Crear / editar / eliminar solicitantes", "Sí", "Sí", "No", "No"],
    ["Crear / editar / eliminar instituciones", "Sí", "Sí", "No", "No"],
    ["Ver lista de Usuarios", "Sí", "Sí", "No", "No"],
    ["Crear / editar / eliminar usuarios", "Sí", "Sí", "No", "No"],
    ["Ver lista de Recursos", "Sí", "Sí", "Sí", "Sí"],
    ["Crear / editar / eliminar recursos", "Sí", "Sí", "No", "No"],
    ["Crear tipos de recurso", "Sí", "Sí", "No", "No"],
    ["Ver / editar perfil propio", "Sí", "Sí", "Ver / editar*", "Ver / editar*"],
    ["Ver catálogos en Configuración", "Sí", "Sí", "Sí", "No (solo Perfil)"],
    ["Modificar catálogos", "Sí", "Sí", "No", "No"],
    ["Generar respaldo de base de datos", "Sí", "Sí", "No", "No"],
    ["Ver Reportes y estadísticas", "Sí", "Sí", "No", "No"],
    ["Exportar reportes a PDF", "Sí", "Sí", "No", "No"],
], widths=[6.5, 2.5, 2.5, 2.5, 2])
body(doc, "* La edición del perfil propio puede estar restringida para ciertos perfiles "
          "según la configuración vigente del sistema.", italic=True)

# ================================================================ Anexo B
doc.add_page_break()
h1(doc, "Anexo B. Catálogos del sistema")
body(doc, "Información de referencia de los catálogos preconfigurados en el sistema. "
          "El administrador puede agregar nuevos registros desde Configuración o desde "
          "los módulos correspondientes.")
h2(doc, "B.1 Estados de actividad")
add_table(doc, ["Estado", "Orden en Kanban"], [
    ["REVISIÓN", "1"], ["AUTORIZADO", "2"], ["EN PROCESO", "3"],
    ["FINALIZADO", "4"], ["CANCELADO", "5"],
], widths=[8, 8])
h2(doc, "B.2 Prioridades")
add_table(doc, ["Prioridad", "Nivel"], [
    ["BAJA", "1"], ["MEDIA", "2"], ["ALTA", "3"], ["URGENTE", "4"],
], widths=[8, 8])
h2(doc, "B.3 Tipos de recurso")
add_table(doc, ["Tipo", "Ejemplos"], [
    ["Equipo Fotográfico", "Cámara Canon EOS y equipos de fotografía"],
    ["Equipo de Video", "Cámaras de video, trípodes, iluminación"],
    ["Equipo de Audio", "Micrófonos inalámbricos, grabadoras"],
    ["Equipo Informático", "Laptops de edición, proyectores"],
], widths=[5, 11])
h2(doc, "B.4 Estados de usuario")
add_table(doc, ["Estado", "Efecto"], [
    ["ACTIVO", "Puede iniciar sesión y usar el sistema"],
    ["INACTIVO", "No puede iniciar sesión"],
    ["EN LÍNEA", "Estado informativo de conexión"],
    ["EN PAUSA", "Cuenta temporalmente suspendida"],
], widths=[5, 11])
h2(doc, "B.5 Cargos de ejemplo")
add_table(doc, ["Cargo"], [
    ["Administrador del sistema"], ["Camarógrafo y fotógrafo"], ["Diseñador Gráfico"],
    ["Director"], ["Técnico Informático"], ["Encargado de Acceso a la Información"],
], widths=[10])
h2(doc, "B.6 Roles")
add_table(doc, ["Rol", "Capacidad"], [
    ["Administrador", "Acceso total de gestión"],
    ["Desarrollador", "Acceso total (cuenta técnica de respaldo)"],
    ["Director de Dependencia", "Solo consulta"],
    ["Lector", "Solo consulta"],
], widths=[6, 10])
h2(doc, "B.7 Tipos de notificación")
add_table(doc, ["Tipo", "Momento"], [
    ["Solicitud asignada", "Al asignar personal a una solicitud"],
    ["Solicitud autorizada", "Al autorizar una solicitud"],
    ["Solicitud cancelada", "Al cancelar una solicitud"],
    ["Cambio de estado", "A otros cambios de etapa"],
    ["Cambio de fecha", "Al modificar fechas, hora o lugar"],
], widths=[5, 11])

# ================================================================ Anexo C
doc.add_page_break()
h1(doc, "Anexo C. Glosario")
add_table(doc, ["Término", "Definición"], [
    ["Asignación", "Registro que vincula un usuario o un recurso a una solicitud."],
    ["Autenticación (JWT)", "Mecanismo de seguridad que mantiene la sesión iniciada durante 8 horas."],
    ["Backup / Respaldo", "Copia de seguridad completa de la base de datos en archivo .sql."],
    ["Backend", "Servidor de datos de la aplicación (puerto 3000)."],
    ["Calendario", "Módulo que muestra las actividades programadas por fecha."],
    ["Catálogo", "Lista de valores predefinidos (estados, prioridades, cargos, etc.)."],
    ["Dashboard", "Panel de indicadores y gráficas de la sección Reportes."],
    ["Desarrollador", "Rol con acceso total, reservado para soporte técnico del sistema."],
    ["Estado de la solicitud", "Etapa del flujo: REVISIÓN, AUTORIZADO, EN PROCESO, FINALIZADO o CANCELADO."],
    ["Frontend", "Interfaz web visible en el navegador (puerto 4200)."],
    ["Historial", "Registro de los cambios de estado de una solicitud."],
    ["Institución", "Organismo al que pertenece un solicitante (ej. Municipalidad)."],
    ["Kanban", "Tablero visual con columnas por estado para seguir el avance del trabajo."],
    ["Notificación", "Aviso automático que recibe un usuario sobre un evento de una solicitud."],
    ["Recurso", "Equipo o instrumento disponible para las actividades."],
    ["Rol", "Conjunto de permisos de un usuario: Administrador, Desarrollador, Director o Lector."],
    ["Solicitud", "Registro de un servicio o actividad solicitado a la Dirección de Comunicación Social."],
    ["Solicitante", "Persona o institución que solicita un servicio."],
    ["Responsable", "Usuario asignado como encargado de una solicitud."],
], widths=[4.5, 11.5])

# ---------------------------------------------------------------- cierre
doc.add_paragraph()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("— Fin del Manual de Usuarios —")
run.bold = True
run.font.color.rgb = NAVY
run.font.size = Pt(12)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("Sistema de Gestión Operativa de Comunicación Social\n"
                "Municipalidad de Santiago Atitlán · Dirección de Comunicación Social\n"
                f"Versión 1.0 · {date.today().strftime('%d/%m/%Y')}")
run.font.size = Pt(9)
run.font.color.rgb = GRAY

# ---------------------------------------------------------------- guardar
import os
out_dir = os.path.dirname(os.path.abspath(__file__))
out_path = os.path.join(
    out_dir,
    "Manual de Usuarios - Sistema de Gestion Operativa de Comunicacion Social.docx",
)
doc.save(out_path)
print(f"Manual generado: {out_path}")
