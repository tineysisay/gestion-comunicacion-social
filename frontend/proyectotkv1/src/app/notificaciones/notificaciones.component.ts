import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  NotificacionUsuarioService,
  NotificacionUsuario
} from '../services/notificacion-usuario.service';
import { NotificacionService } from '../services/notificacion.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.css'
})
export class NotificacionesComponent implements OnInit {

  notificaciones: NotificacionUsuario[] = [];
  cargando = false;
  filtro: 'todas' | 'no-leidas' = 'todas';

  constructor(
    private notificacionUsuarioService: NotificacionUsuarioService,
    private notificacion: NotificacionService,
    private router: Router
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

  get filtradas(): NotificacionUsuario[] {
    if (this.filtro === 'no-leidas') {
      return this.notificaciones.filter((n) => !this.convertidaALeida(n));
    }
    return this.notificaciones;
  }

  convertidaALeida(n: NotificacionUsuario): boolean {
    return n.leida === true || n.leida === 1;
  }

  cambiarFiltro(filtro: 'todas' | 'no-leidas'): void {
    this.filtro = filtro;
  }

  // Clic en una notificacion -> marcar leida y ir a Solicitudes
  abrir(n: NotificacionUsuario): void {
    if (this.convertidaALeida(n)) {
      this.router.navigate(['/inicio/solicitudes']);
      return;
    }
    this.notificacionUsuarioService.marcarLeida(n.id_notificacion).subscribe({
      next: () => {
        n.leida = true;
        this.router.navigate(['/inicio/solicitudes']);
      },
      error: () => this.router.navigate(['/inicio/solicitudes'])
    });
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
