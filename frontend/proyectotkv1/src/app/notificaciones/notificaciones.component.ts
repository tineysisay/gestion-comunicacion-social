import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NotificacionUsuarioService,
  NotificacionUsuario
} from '../services/notificacion-usuario.service';
import { NotificacionService } from '../services/notificacion.service';
import { SolicitudService } from '../services/solicitud.service';
import { FormatoFechaPipe } from '../pipes/formato-fecha.pipe';
import { coloresDeEstado } from '../shared/colores-estado';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, FormatoFechaPipe],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.css'
})
export class NotificacionesComponent implements OnInit {

  notificaciones: NotificacionUsuario[] = [];
  cargando = false;

  // Modal de detalle estilo ficha del Kanban
  mostrarFicha = false;
  solicitudDetalle: any = null;

  constructor(
    private notificacionUsuarioService: NotificacionUsuarioService,
    private notificacion: NotificacionService,
    private solicitudService: SolicitudService
  ) {}

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.cargando = true;
    this.notificacionUsuarioService.obtener().subscribe({
      next: (datos) => {
        this.notificaciones = datos;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar notificaciones:', error);
        this.cargando = false;
        this.notificacion.error('Error al cargar notificaciones');
      }
    });
  }

  get noLeidas(): number {
    return this.notificaciones.filter((n) => !this.convertidaALeida(n)).length;
  }

  get leidas(): number {
    return this.notificaciones.filter((n) => this.convertidaALeida(n)).length;
  }

  // Seccion 1: notificaciones sin leer
  get sinLeer(): NotificacionUsuario[] {
    return this.notificaciones.filter((n) => !this.convertidaALeida(n));
  }

  // Seccion 2: notificaciones leidas (aqui aparece la opcion de eliminar)
  get leidasLista(): NotificacionUsuario[] {
    return this.notificaciones.filter((n) => this.convertidaALeida(n));
  }

  convertidaALeida(n: NotificacionUsuario): boolean {
    return n.leida === true || n.leida === 1;
  }

  // Clic en una notificacion -> marcar leida y abrir la ficha del detalle
  abrir(n: NotificacionUsuario): void {
    if (!n.id_solicitud) {
      this.notificacion.info('Esta notificacion no tiene una solicitud asociada');
      return;
    }

    if (this.mostrarFicha && this.solicitudDetalle?.id_solicitud === n.id_solicitud) {
      this.cerrarFicha();
      return;
    }

    this.solicitudService.obtenerPorId(n.id_solicitud).subscribe({
      next: (detalle) => {
        this.solicitudDetalle = detalle;
        this.mostrarFicha = true;
      },
      error: () => this.notificacion.error('Error al cargar el detalle de la solicitud')
    });

    if (this.convertidaALeida(n)) return;
    this.notificacionUsuarioService.marcarLeida(n.id_notificacion).subscribe({
      next: () => { n.leida = true; },
      error: () => { this.notificacion.error('Error al marcar notificacion'); }
    });
  }

  cerrarFicha(): void {
    this.mostrarFicha = false;
    this.solicitudDetalle = null;
  }

  // Colores del modal de detalle (segun estado de la solicitud)
  colorEstadoDetalle(): string {
    return coloresDeEstado(this.solicitudDetalle?.nombre_estado).color;
  }

  colorEstadoClaroDetalle(): string {
    return coloresDeEstado(this.solicitudDetalle?.nombre_estado).claro;
  }

  colorPrioridadDetalle(): string {
    const prioridad = (this.solicitudDetalle?.nombre_prioridad || '').toLowerCase();
    if (prioridad.includes('urgente')) return '#DC2626';
    if (prioridad.includes('alta')) return '#F59E0B';
    if (prioridad.includes('media')) return '#3B82F6';
    return '#64748B';
  }

  rangoFechas(inicio: string, fin: string): string {
    if (!inicio) return '';
    const i = inicio.substring(0, 10);
    const f = fin ? fin.substring(0, 10) : i;
    if (f === i) return i.split('-').reverse().join('/');
    return `${i.split('-').reverse().join('/')} - ${f.split('-').reverse().join('/')}`;
  }

  marcarLeida(n: NotificacionUsuario, event: Event): void {
    event.stopPropagation();
    if (this.convertidaALeida(n)) return;
    this.notificacionUsuarioService.marcarLeida(n.id_notificacion).subscribe({
      next: () => { n.leida = true; },
      error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al marcar notificacion')
    });
  }

  marcarTodas(): void {
    this.notificacionUsuarioService.marcarTodas().subscribe({
      next: () => {
        this.notificaciones.forEach((n) => { n.leida = true; });
        this.notificacion.exito('Notificaciones marcadas como leidas');
      },
      error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al marcar notificaciones')
    });
  }

  async eliminar(n: NotificacionUsuario, event: Event): Promise<void> {
    event.stopPropagation();
    const confirmado = await this.notificacion.confirmar('Esta seguro de eliminar esta notificacion?');
    if (!confirmado) return;
    this.notificacionUsuarioService.eliminar(n.id_notificacion).subscribe({
      next: () => {
        this.notificaciones = this.notificaciones.filter((x) => x.id_notificacion !== n.id_notificacion);
        this.notificacion.exito('Notificacion eliminada');
      },
      error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al eliminar notificacion')
    });
  }

  fechaRelativa(fecha: string): string {
    if (!fecha) return '';
    const fechaNotif = new Date(fecha.replace(' ', 'T'));
    const ahora = new Date();
    const diffMs = ahora.getTime() - fechaNotif.getTime();
    const minutos = Math.floor(diffMs / 60000);

    if (minutos < 1) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} min`;

    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} h`;

    const dias = Math.floor(horas / 24);
    if (dias < 7) return `Hace ${dias} dia${dias > 1 ? 's' : ''}`;

    return fechaNotif.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  fechaHora(fecha: string): string {
    if (!fecha) return '';
    const fechaNotif = new Date(fecha.replace(' ', 'T'));
    return fechaNotif.toLocaleString('es-GT', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  iconoTipo(tipo: string): string {
    const t = (tipo || '').toUpperCase();
    if (t.includes('ASIGNADA')) return 'asignada';
    if (t.includes('AUTORIZADA')) return 'autorizada';
    if (t.includes('CANCELADA')) return 'cancelada';
    if (t.includes('FECHA')) return 'fecha';
    return 'estado';
  }
}
