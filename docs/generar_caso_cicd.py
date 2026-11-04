# -*- coding: utf-8 -*-
"""
Genera el Caso Practico "Testing Continuo con CI/CD" (.docx) basado en el
Sistema de Gestion Operativa de Comunicacion Social (tablero Kanban).

Uso:  py -3 docs/generar_caso_cicd.py
Salida: docs/Caso Práctico - Testing Continuo CI-CD.docx
"""

import os
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from datetime import date

# ---------------------------------------------------------------- colores
NAVY = RGBColor(0x1F, 0x38, 0x64)
BLUE = RGBColor(0x2E, 0x5B, 0xA6)
GRAY = RGBColor(0x59, 0x59, 0x59)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
RED = RGBColor(0xC0, 0x00, 0x00)
GREEN = RGBColor(0x1E, 0x6B, 0x2E)

HDR_FILL = "1F3864"      # tabla: encabezado azul marino
ALT_FILL = "D9E2F3"      # tabla: fila alterna azul claro
BOX_FILL = "DEEBF7"      # cajas del diagrama (azul claro)
DEC_FILL = "FFE699"      # caja de decision (amarillo)
FAIL_FILL = "F8CBAD"     # caja de fallo (rojo claro)
OK_FILL = "C6E0B4"       # caja de exito (verde claro)


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


def add_box(doc, lines, fill=BOX_FILL, width=16):
    """Caja del diagrama: tabla de 1 celda con fondo y texto centrado.
    lines: lista de (texto, bold, size) o string simple."""
    t = doc.add_table(rows=1, cols=1)
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = t.rows[0].cells[0]
    c.width = Cm(width)
    shade(c, fill)
    c.text = ""
    first = True
    for item in lines:
        if isinstance(item, str):
            item = (item, False, 10)
        texto, bold, size = item
        if first:
            p = c.paragraphs[0]
            first = False
        else:
            p = c.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(texto)
        run.bold = bold
        run.font.size = Pt(size)
    return t


def add_two_boxes(doc, left, right, left_fill=BOX_FILL, right_fill=BOX_FILL, width=8):
    """Dos cajas lado a lado (paso paralelo o bifurcacion)."""
    t = doc.add_table(rows=1, cols=2)
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for cell, lines, fill in ((t.rows[0].cells[0], left, left_fill),
                              (t.rows[0].cells[1], right, right_fill)):
        cell.width = Cm(width)
        shade(cell, fill)
        cell.text = ""
        first = True
        for item in lines:
            if isinstance(item, str):
                item = (item, False, 10)
            texto, bold, size = item
            if first:
                p = cell.paragraphs[0]
                first = False
            else:
                p = cell.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(texto)
            run.bold = bold
            run.font.size = Pt(size)
    return t


def add_arrow(doc, label=None):
    """Flecha vertical entre cajas del diagrama."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run("↓")
    run.bold = True
    run.font.size = Pt(16)
    run.font.color.rgb = NAVY
    if label:
        rl = p.add_run("  " + label)
        rl.font.size = Pt(9)
        rl.italic = True
        rl.font.color.rgb = GRAY


def add_caption(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    run.italic = True
    run.font.size = Pt(9)
    run.font.color.rgb = GRAY


def add_qa(doc, question, answer):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(question)
    run.bold = True
    run.font.size = Pt(11)
    run.font.color.rgb = NAVY
    body(doc, answer)


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

# margenes
for section in doc.sections:
    section.top_margin = Cm(2)
    section.bottom_margin = Cm(2)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.5)

# ---------------------------------------------------------------- titulo
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("CASO PRÁCTICO")
run.bold = True
run.font.size = Pt(13)
run.font.color.rgb = BLUE

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("TESTING CONTINUO CON CI/CD")
run.bold = True
run.font.size = Pt(26)
run.font.color.rgb = NAVY

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("Sistema de Gestión Operativa de Comunicación Social")
run.font.size = Pt(13)
run.font.color.rgb = GRAY

doc.add_paragraph()

# ---------------------------------------------------------------- Paso 1
h1(doc, "Paso 1 – Diseñe su caso")

h2(doc, "1. Nombre de la aplicación")
p = doc.add_paragraph()
run = p.add_run("Sistema de Gestión Operativa de Comunicación Social (Tablero Kanban)")
run.bold = True
run.font.size = Pt(12)
run.font.color.rgb = NAVY

h2(doc, "2. Descripción breve")
body(doc,
     "Aplicación web de la Dirección de Comunicación Social de la Municipalidad de "
     "Santiago Atitlán que registra y da seguimiento a las solicitudes de actividades "
     "mediante un tablero Kanban con estados (Revisión → Autorizado → En proceso → "
     "Finalizado), calendario, reportes y roles de acceso con JWT. Permite a los "
     "administradores crear solicitudes, asignar personal y recursos, y a los demás "
     "usuarios consultar el avance del trabajo. Está construida con Angular 17 "
     "(frontend), Node.js con Express (backend) y MySQL (base de datos).")

# ---------------------------------------------------------------- Paso 2
h1(doc, "Paso 2 – Defina qué probaría")
body(doc,
     "Las 3 funciones principales del sistema que deben probarse automáticamente son: "
     "iniciar sesión, crear una solicitud de actividad y cambiar el estado de una "
     "solicitud desde el tablero Kanban. Para cada una se aplican los 4 tipos de prueba "
     "requeridos (unitaria, de integración, de interfaz y de rendimiento):")

add_table(
    doc,
    ["Función a probar", "Tipo de prueba", "Qué se verifica", "Herramienta"],
    [
        ["Iniciar sesión (JWT)", "Unitaria",
         "Validación de campos vacíos y comparación de la contraseña escrita con el hash bcrypt guardado en la base de datos.",
         "Jest (Node.js)"],
        ["Iniciar sesión (JWT)", "De integración",
         "Que el endpoint POST /api/login conecte con MySQL, verifique credenciales válidas y devuelva un token JWT; y que rechace credenciales incorrectas.",
         "Supertest + BD de prueba"],
        ["Iniciar sesión (JWT)", "De interfaz (E2E)",
         "Escribir usuario y contraseña en el formulario, iniciar sesión y comprobar que abre el tablero Kanban; verificar también el mensaje de error con credenciales malas.",
         "Cypress"],
        ["Iniciar sesión (JWT)", "De rendimiento",
         "Que el login responda en menos de 1 segundo con 50 peticiones simultáneas.",
         "k6"],

        ["Crear una solicitud de actividad", "Unitaria",
         "Validaciones del formulario: campos obligatorios, formato de fecha y que la fecha fin no sea anterior a la fecha de actividad.",
         "Jest / ng test"],
        ["Crear una solicitud de actividad", "De integración",
         "Que POST /api/solicitudes guarde la solicitud en MySQL con su solicitante, prioridad y estado inicial REVISIÓN.",
         "Supertest + BD de prueba"],
        ["Crear una solicitud de actividad", "De interfaz (E2E)",
         "Completar el formulario (datos, solicitante, responsable), guardar y verificar que la tarjeta aparece en la columna Revisión del Kanban.",
         "Cypress"],
        ["Crear una solicitud de actividad", "De rendimiento",
         "Que el alta de solicitudes mantenga tiempos estables con 20 peticiones por segundo.",
         "k6"],

        ["Cambiar estado de una solicitud (arrastrando en el Kanban)", "Unitaria",
         "Lógica de transición de estados y asignación de la tarjeta a la columna correcta tras el cambio (incluye ocultar FINALIZADO a los 7 días).",
         "Jest"],
        ["Cambiar estado de una solicitud (arrastrando en el Kanban)", "De integración",
         "Que el cambio de estado actualice solicitud_actividad, registre el historial y dispare la notificación correspondiente.",
         "Supertest + BD de prueba"],
        ["Cambiar estado de una solicitud (arrastrando en el Kanban)", "De interfaz (E2E)",
         "Arrastrar una tarjeta de Revisión a Autorizado y comprobar que cambia de columna, el contador se actualiza y aparece la notificación de éxito.",
         "Cypress"],
        ["Cambiar estado de una solicitud (arrastrando en el Kanban)", "De rendimiento",
         "Que el tablero cargue en menos de 2 segundos con 200 solicitudes y que el cambio de estado responda con varios usuarios editando a la vez.",
         "k6"],
    ],
    widths=[3.4, 2.8, 6.8, 3.0],
)

# ---------------------------------------------------------------- Paso 3
h1(doc, "Paso 3 – Diseñe su flujo CI/CD")

h2(doc, "3.1 Descripción del proceso en pasos simples")
add_steps(doc, [
    "El programador modifica el código (una nueva función o una corrección) y lo sube a GitHub con git push.",
    "GitHub Actions detecta el push y lanza automáticamente el workflow de integración continua (.github/workflows/ci.yml).",
    "Se ejecutan en paralelo los trabajos del backend (instalar dependencias → ESLint → pruebas unitarias con Jest → pruebas de integración con Supertest y una base de datos MySQL de prueba) y del frontend (instalar dependencias → ESLint → pruebas unitarias con ng test → pruebas E2E con Cypress).",
    "Si alguna prueba falla, GitHub marca el pipeline como fallido, notifica al equipo y no se permite fusionar el código hasta corregirlo.",
    "Si todo pasa, se genera el build (ng build del frontend y empaquetado del backend) y se publica automáticamente en el entorno de pruebas (staging).",
    "Un revisor del equipo QA revisa y aprueba los cambios en staging; solo entonces el pipeline despliega la nueva versión a producción.",
])

h2(doc, "3.2 Diagrama del flujo CI/CD")

add_box(doc, [
    ("1. El desarrollador cambia el código", True, 11),
    ("(nueva función o corrección de un error)", False, 10),
])
add_arrow(doc)
add_box(doc, [
    ("2. git push a GitHub", True, 11),
    ("rama main o rama de feature", False, 10),
])
add_arrow(doc)
add_box(doc, [
    ("3. GitHub Actions detecta el push y ejecuta el workflow CI", True, 11),
    (".github/workflows/ci.yml", False, 10),
])
add_arrow(doc, "los trabajos corren en paralelo")

add_two_boxes(doc,
    left=[
        ("JOB BACKEND", True, 11),
        ("npm install (dependencias)", False, 10),
        ("ESLint (análisis de código)", False, 10),
        ("Pruebas unitarias (Jest)", False, 10),
        ("Pruebas de integración (Supertest + MySQL de prueba)", False, 10),
    ],
    right=[
        ("JOB FRONTEND", True, 11),
        ("npm install (dependencias)", False, 10),
        ("ng lint (análisis de código)", False, 10),
        ("Pruebas unitarias (ng test)", False, 10),
        ("Pruebas E2E (Cypress)", False, 10),
    ])
add_arrow(doc)

add_box(doc, [
    ("4. ¿Todas las pruebas pasaron?", True, 11),
], fill=DEC_FILL)
add_arrow(doc)

add_two_boxes(doc,
    left=[
        ("NO → FALLA", True, 11),
        ("GitHub marca el pipeline como fallido, notifica al equipo y bloquea el merge (protección de rama).", False, 10),
    ],
    right=[
        ("SÍ → CONTINÚA", True, 11),
        ("El código está listo para pasar a la siguiente etapa del despliegue.", False, 10),
    ],
    left_fill=FAIL_FILL, right_fill=OK_FILL)
add_arrow(doc, "solo si la respuesta fue SÍ")

add_box(doc, [
    ("5. Build automático", True, 11),
    ("ng build del frontend y empaquetado del backend", False, 10),
])
add_arrow(doc)
add_box(doc, [
    ("6. Despliegue automático a STAGING", True, 11),
    ("entorno de pruebas accesible para el equipo QA", False, 10),
])
add_arrow(doc)
add_box(doc, [
    ("7. Revisión y aprobación manual del equipo QA", True, 11),
    ("verificación humana antes de producción", False, 10),
], fill=DEC_FILL)
add_arrow(doc)
add_box(doc, [
    ("8. Despliegue a PRODUCCIÓN", True, 11),
    ("la mejora queda disponible para los usuarios del sistema", False, 10),
], fill=OK_FILL)

add_caption(doc, "Figura 1. Flujo de Testing Continuo con CI/CD del caso práctico.")

# ---------------------------------------------------------------- Paso 4
h1(doc, "Paso 4 – Reflexión final")

add_qa(doc,
       "1. ¿Qué beneficios aporta tener un sistema CI/CD en su caso?",
       "Detecta errores en minutos después de cada cambio, en lugar de días o semanas "
       "después; garantiza que el login, el alta de solicitudes y los cambios de estado "
       "del Kanban sigan funcionando antes de llegar a los usuarios; permite entregar "
       "mejoras con confianza y sin depender de pruebas manuales; y deja un registro "
       "automático de que cada versión del sistema fue probada.")

add_qa(doc,
       "2. ¿Qué problemas se evitarían al automatizar las pruebas?",
       "Se evitarían fallas como un login que deja de funcionar tras un cambio, "
       "solicitudes que no se guardan correctamente, estados del tablero mal "
       "actualizados o errores de acentos que llegan a los usuarios; también se "
       "evitarían las pruebas manuales que se olvidan por falta de tiempo, los largos "
       "períodos depurando en qué cambio se rompió el sistema y las diferencias entre "
       "lo probado en desarrollo y lo que se publica en producción.")

add_qa(doc,
       "3. ¿Qué parte del proceso le gustaría automatizar primero y por qué?",
       "Las pruebas unitarias del backend (validación de fechas y estados de las "
       "solicitudes y autenticación con JWT), porque son las más rápidas de ejecutar "
       "(segundos), no necesitan navegador ni base de datos montada, protegen la lógica "
       "de negocio más crítica del sistema y ofrecen el feedback más inmediato al "
       "programador; sobre esa base se podrían agregar después las pruebas de "
       "integración, de interfaz y de rendimiento.")

# ---------------------------------------------------------------- cierre
doc.add_paragraph()
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("— Fin del caso práctico —")
run.bold = True
run.font.color.rgb = NAVY
run.font.size = Pt(12)

p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p.add_run("Testing Continuo con CI/CD\n"
                "Sistema de Gestión Operativa de Comunicación Social\n"
                f"{date.today().strftime('%d/%m/%Y')}")
run.font.size = Pt(9)
run.font.color.rgb = GRAY

# ---------------------------------------------------------------- guardar
out_dir = os.path.dirname(os.path.abspath(__file__))
out_path = os.path.join(out_dir, "Caso Práctico - Testing Continuo CI-CD.docx")
doc.save(out_path)
print(f"Documento generado: {out_path}")
