# -*- coding: utf-8 -*-
"""
Toma capturas de pantalla automaticas del Sistema de Gestion Operativa de
Comunicacion Social usando Playwright (Chromium headless) y las guarda en
docs/capturas/ para insertarlas en el manual de usuarios.

Requisitos: backend (:3000), frontend (:4200) y MySQL ejecutandose.
Uso:  py -3 docs/tomar_capturas.py
"""

import os
import sys
import traceback
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

BASE = "http://localhost:4200"
USER = "admin"
PASS = "admin123"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "capturas")
os.makedirs(OUT, exist_ok=True)

taken = []
failed = []


def shot(page, name, desc):
    path = os.path.join(OUT, name)
    page.screenshot(path=path, full_page=False)
    taken.append(name)
    print(f"  [OK] {name} - {desc}")


def safe_shot(page, name, desc, before=None):
    """Captura; si hay accion previa que falla, captura igual la pantalla actual."""
    try:
        if before:
            before()
        shot(page, name, desc)
    except Exception as e:
        print(f"  [AVISO] {name}: {e.__class__.__name__} - capturando pantalla actual")
        shot(page, name, desc)


def goto_side(page, title):
    page.click(f'a[title="{title}"]')
    page.wait_for_timeout(1200)


def close_modal(page):
    """Cierra modales/formularios con boton Cerrar exacto; no falla si no existe."""
    try:
        page.get_by_role("button", name="Cerrar", exact=True).first.click(timeout=3000)
        page.wait_for_timeout(400)
    except Exception:
        pass


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 1400, "height": 900},
            device_scale_factor=1.5,
            locale="es-GT",
        )
        page = ctx.new_page()
        page.set_default_timeout(8000)

        print("== 1. Pantalla de login ==")
        page.goto(BASE, wait_until="networkidle")
        page.wait_for_selector('input[name="usuario"]')
        shot(page, "01-login.png", "Pantalla de inicio de sesion")

        print("== 2. Inicio de sesion ==")
        page.fill('input[name="usuario"]', USER)
        page.fill('input[name="contrasena"]', PASS)
        page.click("button.btn-login")
        page.wait_for_selector(".kanban-container", timeout=15000)
        page.wait_for_timeout(1500)
        shot(page, "02-kanban.png", "Tablero Kanban")

        print("== 3. Detalle de tarjeta Kanban ==")

        def open_card():
            cards = page.locator(".kanban-card")
            if cards.count() == 0:
                raise RuntimeError("sin tarjetas")
            cards.first.click()
            page.wait_for_selector("text=Personal Asignado", timeout=6000)
            page.wait_for_timeout(500)

        safe_shot(page, "03-kanban-detalle.png", "Modal detalle desde Kanban", before=open_card)
        close_modal(page)

        print("== 4. Listado de solicitudes ==")
        goto_side(page, "Solicitudes")
        page.wait_for_selector("table", timeout=8000)
        page.wait_for_timeout(800)
        shot(page, "04-solicitudes.png", "Listado de solicitudes")

        print("== 5. Formulario nueva solicitud ==")

        def open_form():
            page.get_by_role("button", name="+ Nueva solicitud").first.click()
            page.wait_for_selector("text=Datos de la Actividad", timeout=6000)
            page.wait_for_timeout(500)

        safe_shot(page, "05-solicitud-nueva.png", "Formulario con pestanas", before=open_form)
        try:
            page.locator("button:has-text('Cancelar')").last.click(timeout=3000)
            page.wait_for_timeout(500)
        except Exception:
            pass

        print("== 6. Detalle de solicitud ==")

        def open_detail():
            page.locator("button.btn-ver").first.click()
            page.wait_for_selector("text=Cambiar estado", timeout=6000)
            page.wait_for_timeout(500)

        try:
            safe_shot(page, "06-solicitud-detalle.png", "Detalle con estado/personal/recursos", before=open_detail)
        finally:
            close_modal(page)

        print("== 7. Calendario mes ==")
        goto_side(page, "Calendario")
        page.wait_for_selector(".btn-vista", timeout=8000)
        page.wait_for_timeout(1000)
        shot(page, "07-calendario-mes.png", "Calendario vista mes")

        print("== 8. Detalle de evento ==")

        def open_event():
            ev = page.locator(".evento, .evento-dia")
            if ev.count() == 0:
                raise RuntimeError("sin eventos")
            ev.first.click()
            page.wait_for_timeout(800)

        safe_shot(page, "08-calendario-detalle.png", "Modal detalle de actividad", before=open_event)
        close_modal(page)

        print("== 9. Notificaciones ==")
        goto_side(page, "Notificaciones")
        page.wait_for_timeout(1200)
        shot(page, "09-notificaciones.png", "Centro de notificaciones")

        print("== 10. Solicitantes ==")
        goto_side(page, "Solicitantes")
        page.wait_for_timeout(1200)
        shot(page, "10-solicitantes.png", "Listado de solicitantes")

        print("== 11. Usuarios ==")
        goto_side(page, "Usuarios")
        page.wait_for_timeout(1200)
        shot(page, "11-usuarios.png", "Listado de usuarios")

        print("== 12. Recursos ==")
        goto_side(page, "Recursos")
        page.wait_for_timeout(1200)
        shot(page, "12-recursos.png", "Listado de recursos")

        print("== 13. Configuracion ==")
        goto_side(page, "Configuracion")
        page.wait_for_selector("button.pestana", timeout=8000)
        try:
            page.locator("button.pestana", has_text="Estados de Actividad").first.click(timeout=4000)
            page.wait_for_timeout(700)
        except Exception:
            pass
        shot(page, "13-configuracion.png", "Configuracion (catalogos)")

        print("== 14. Reportes ==")
        goto_side(page, "Reportes")
        page.wait_for_timeout(2000)
        shot(page, "14-reportes.png", "Dashboard de reportes")

        browser.close()

    print(f"\nCapturas generadas: {len(taken)} en {OUT}")
    for t in taken:
        print("  -", t)
    if len(taken) < 14:
        print("ADVERTENCIA: menos de 14 capturas")
        return 1
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        traceback.print_exc()
        sys.exit(1)
