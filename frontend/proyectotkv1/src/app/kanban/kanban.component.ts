import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SolicitudService } from '../services/solicitud.service';
import { CatalogoService } from '../services/catalogo.service';
import { SolicitanteService } from '../services/solicitante.service';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { FormatoFechaPipe } from '../pipes/formato-fecha.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FormatoFechaPipe],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.css'
})
export class KanbanComponent implements OnInit, OnDestroy {

  columnas: any[] = [];
  solicitudes: any[] = [];
  solicitudSeleccionada: any = null;
  showModal = false;
  modoEdicion = false;
  idEditar = 0;
  private subscription: Subscription = new Subscription();

  // Catalogos
  solicitantes: any[] = [];
  estadosActividad: any[] = [];
  prioridades: any[] = [];
  usuarios: any[] = [];

  // Accordion
  seccionDatos = true;
  seccionSolicitante = false;
  seccionResponsable = false;
  seccionEstado = false;

  // Formulario
  nombreActividad = '';
  descripcionActividad = '';
  fechaActividad = '';
  horaInicio = '';
  horaFin = '';
  lugarActividad = '';
  idSolicitante = 0;
  idEstadoActividad = 0;
  idPrioridad = 0;
  personalAsignado: number[] = [];

  constructor(
    private solicitudService: SolicitudService,
    private catalogoService: CatalogoService,
    private solicitanteService: SolicitanteService,
    private api: ApiService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
    this.subscription.add(
      this.solicitudService.observarCambios().subscribe(() => {
        this.cargarSolicitudes();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  cargarCatalogos(): void {
    this.catalogoService.obtenerEstadosActividad().subscribe({
      next: (estados) => {
        this.estadosActividad = estados;
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

    this.solicitanteService.obtenerTodos().subscribe({
      next: (datos) => this.solicitantes = datos,
      error: (err) => console.error('Error al cargar solicitantes', err)
    });

    this.catalogoService.obtenerPrioridades().subscribe({
      next: (datos) => this.prioridades = datos,
      error: (err) => console.error('Error al cargar prioridades', err)
    });

    this.api.get<any[]>('usuarios').subscribe({
      next: (datos) => this.usuarios = datos,
      error: (err) => console.error('Error al cargar usuarios', err)
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
    this.modoEdicion = false;
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
    this.modoEdicion = false;
  }

  getPrioridadClase(nivel: number): string {
    if (nivel === 1) return 'prioridad-alta';
    if (nivel === 2) return 'prioridad-media';
    return 'prioridad-baja';
  }

  editarSolicitud(): void {
    const s = this.solicitudSeleccionada;
    this.modoEdicion = true;
    this.idEditar = s.id_solicitud;
    this.nombreActividad = s.nombre_actividad;
    this.descripcionActividad = s.descripcion_actividad || '';
    this.fechaActividad = s.fecha_actividad ? s.fecha_actividad.substring(0, 10) : '';
    this.horaInicio = s.hora_inicio || '';
    this.horaFin = s.hora_fin || '';
    this.lugarActividad = s.lugar_actividad || '';
    this.idSolicitante = s.id_solicitante || 0;
    this.idEstadoActividad = s.id_estado_actividad || 0;
    this.idPrioridad = s.id_prioridad || 0;

    this.solicitudService.obtenerAsignacionesUsuario(s.id_solicitud).subscribe({
      next: (asignaciones) => {
        this.personalAsignado = asignaciones.map((a: any) => a.id_usuario);
      },
      error: (err) => console.error('Error al cargar asignaciones', err)
    });
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.personalAsignado = [];
  }

  toggleResponsable(idUsuario: number): void {
    const idx = this.personalAsignado.indexOf(idUsuario);
    if (idx >= 0) {
      this.personalAsignado.splice(idx, 1);
    } else {
      this.personalAsignado.push(idUsuario);
    }
  }

  estaAsignado(idUsuario: number): boolean {
    return this.personalAsignado.includes(idUsuario);
  }

  guardarEdicion(): void {
    const data = {
      nombreActividad: this.nombreActividad,
      descripcionActividad: this.descripcionActividad,
      fechaActividad: this.fechaActividad,
      horaInicio: this.horaInicio,
      horaFin: this.horaFin,
      lugarActividad: this.lugarActividad,
      idSolicitante: this.idSolicitante,
      idEstadoActividad: this.idEstadoActividad,
      idPrioridad: this.idPrioridad,
      personalAsignado: this.personalAsignado
    };

    this.solicitudService.actualizar(this.idEditar, data).subscribe({
      next: (respuesta) => {
        alert(respuesta.mensaje);
        this.showModal = false;
        this.modoEdicion = false;
        this.solicitudSeleccionada = null;
        this.personalAsignado = [];
        this.cargarSolicitudes();
        this.solicitudService.notificarCambio();
      },
      error: (error) => alert(error.error?.mensaje || 'Error al actualizar')
    });
  }
}
