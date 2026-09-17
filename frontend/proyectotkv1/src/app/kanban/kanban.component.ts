import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { SolicitudService } from '../services/solicitud.service';
import { CatalogoService } from '../services/catalogo.service';
import { AuthService } from '../services/auth.service';
import { FormatoFechaPipe } from '../pipes/formato-fecha.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, RouterLink, FormatoFechaPipe],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.css'
})
export class KanbanComponent implements OnInit, OnDestroy {

  columnas: any[] = [];
  solicitudes: any[] = [];
  solicitudSeleccionada: any = null;
  showModal = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private solicitudService: SolicitudService,
    private catalogoService: CatalogoService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
    // Suscribirse a cambios para recargar automaticamente
    this.subscription.add(
      this.solicitudService.observarCambios().subscribe(() => {
        this.cargarSolicitudes();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  cargarDatos(): void {
    this.catalogoService.obtenerEstadosActividad().subscribe({
      next: (estados) => {
        this.columnas = estados.map((e: any) => ({
          id: e.id_estado_actividad,
          nombre: e.nombre_estado,
          orden: e.orden_kanban,
          solicitudes: []
        }));
        this.cargarSolicitudes();
      },
      error: (err) => console.error('Error al cargar estados', err)
    });
  }

  cargarSolicitudes(): void {
    this.solicitudService.obtenerTodas().subscribe({
      next: (solicitudes) => {
        this.solicitudes = solicitudes;
        this.asignarSolicitudesAColumnas();
      },
      error: (err) => console.error('Error al cargar solicitudes', err)
    });
  }

  asignarSolicitudesAColumnas(): void {
    this.columnas.forEach(col => col.solicitudes = []);
    this.solicitudes.forEach(sol => {
      const col = this.columnas.find(c => c.nombre === sol.estado);
      if (col) {
        col.solicitudes.push(sol);
      }
    });
  }

  verDetalle(solicitud: any): void {
    this.solicitudService.obtenerPorId(solicitud.id_solicitud).subscribe({
      next: (detalle) => {
        this.solicitudSeleccionada = detalle;
        this.showModal = true;
      },
      error: (err) => console.error('Error al obtener detalle', err)
    });
  }

  cerrarModal(): void {
    this.showModal = false;
    this.solicitudSeleccionada = null;
  }

  getPrioridadClase(nivel: number): string {
    if (nivel === 1) return 'prioridad-alta';
    if (nivel === 2) return 'prioridad-media';
    return 'prioridad-baja';
  }

  editarSolicitud(solicitud: any): void {
    this.cerrarModal();
    this.router.navigate(['/inicio/solicitudes'], { queryParams: { editar: solicitud.id_solicitud } });
  }
}
