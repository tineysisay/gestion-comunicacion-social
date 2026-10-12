import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SolicitudService } from '../services/solicitud.service';
import { CatalogoService } from '../services/catalogo.service';
import { SolicitanteService } from '../services/solicitante.service';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { NotificacionService } from '../services/notificacion.service';
import { FormatoFechaPipe } from '../pipes/formato-fecha.pipe';
import { coloresDeEstado } from '../shared/colores-estado';
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
  solicitudArrastrada: any = null;
  columnaResaltada: number | null = null;
  private subscription: Subscription = new Subscription();

  // Fecha actual en el encabezado del tablero
  hoy: Date = new Date();
  private intervaloFecha: any = null;
  private readonly DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  private readonly MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  // Catalogos
  solicitantes: any[] = [];
  estadosActividad: any[] = [];
  prioridades: any[] = [];
  usuarios: any[] = [];

  // Pestañas del formulario
  pestana = 'datos';

  @ViewChild('formSolicitud') formSolicitud!: NgForm;

  // Formulario
  nombreActividad = '';
  descripcionActividad = '';
  fechaActividad = '';
  fechaFinActividad = '';
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
    public authService: AuthService,
    private notificacion: NotificacionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
    this.intervaloFecha = setInterval(() => {
      this.hoy = new Date();
    }, 60000);
    this.subscription.add(
      this.solicitudService.observarCambios().subscribe(() => {
        this.cargarSolicitudes();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.intervaloFecha) {
      clearInterval(this.intervaloFecha);
    }
  }

  get fechaActualLarga(): string {
    const dia = this.DIAS_SEMANA[this.hoy.getDay()];
    const numeroDia = this.hoy.getDate();
    const mes = this.MESES[this.hoy.getMonth()];
    const anio = this.hoy.getFullYear();
    const texto = `${dia}, ${numeroDia} de ${mes} de ${anio}`;
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  cargarCatalogos(): void {
    this.catalogoService.obtenerEstadosActividad().subscribe({
      next: (estados) => {
        this.estadosActividad = estados;
        this.columnas = estados.map((e: any) => {
          const paleta = coloresDeEstado(e.nombre_estado);
          return {
            id: e.id_estado_actividad,
            nombre: e.nombre_estado,
            orden: e.orden_kanban,
            color: paleta.color,
            colorClaro: paleta.claro,
            solicitudes: []
          };
        });
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

  nuevaSolicitud(): void {
    this.router.navigate(['/inicio/solicitudes'], { queryParams: { nueva: 'true' } });
  }

  editarSolicitud(): void {
    const s = this.solicitudSeleccionada;
    this.modoEdicion = true;
    this.pestana = 'datos';
    this.idEditar = s.id_solicitud;
    this.nombreActividad = s.nombre_actividad;
    this.descripcionActividad = s.descripcion_actividad || '';
    this.fechaActividad = s.fecha_actividad ? s.fecha_actividad.substring(0, 10) : '';
    this.fechaFinActividad = (s.fecha_fin_actividad || s.fecha_actividad)
      ? (s.fecha_fin_actividad || s.fecha_actividad).substring(0, 10)
      : '';
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

  rangoFechas(inicio: string, fin: string): string {
    if (!inicio) return '';
    const inicioFmt = inicio.substring(0, 10);
    const finFmt = fin ? fin.substring(0, 10) : inicioFmt;
    if (finFmt === inicioFmt) {
      return inicioFmt.split('-').reverse().join('/');
    }
    return `${inicioFmt.split('-').reverse().join('/')} - ${finFmt.split('-').reverse().join('/')}`;
  }

  // === Arrastre entre columnas (solo admin) ===

  onDragStart(event: DragEvent, solicitud: any): void {
    if (!this.authService.esAdmin()) {
      event.preventDefault();
      return;
    }
    this.solicitudArrastrada = solicitud;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(solicitud.id_solicitud));
    }
  }

  onDragEnd(): void {
    this.solicitudArrastrada = null;
    this.columnaResaltada = null;
  }

  onDragOver(event: DragEvent): void {
    if (!this.solicitudArrastrada) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDragEnter(columna: any): void {
    if (!this.solicitudArrastrada) return;
    this.columnaResaltada = columna.id;
  }

  onDragLeave(event: DragEvent, columna: any): void {
    const destino = event.currentTarget as HTMLElement;
    if (event.relatedTarget && destino.contains(event.relatedTarget as Node)) {
      return;
    }
    if (this.columnaResaltada === columna.id) {
      this.columnaResaltada = null;
    }
  }

  onDrop(event: DragEvent, columna: any): void {
    event.preventDefault();
    const solicitud = this.solicitudArrastrada;
    this.solicitudArrastrada = null;
    this.columnaResaltada = null;

    if (!solicitud || !this.authService.esAdmin()) return;
    if (solicitud.estado === columna.nombre) return;

    const estadoAnterior = solicitud.estado;

    // Movimiento optimista: la tarjeta cambia de columna al instante
    solicitud.estado = columna.nombre;
    this.asignarSolicitudesAColumnas();

    this.solicitudService.cambiarEstado(solicitud.id_solicitud, {
      idEstadoNuevo: columna.id,
      observacion: 'Cambio desde tablero Kanban (arrastre)'
    }).subscribe({
      next: (respuesta) => {
        this.notificacion.exito(
          `Solicitud #${solicitud.id_solicitud} actualizada: ${columna.nombre}`
        );
        this.cargarSolicitudes();
        this.solicitudService.notificarCambio();
      },
      error: (error) => {
        // Revertir el movimiento si el servidor rechazo el cambio
        solicitud.estado = estadoAnterior;
        this.asignarSolicitudesAColumnas();
        this.notificacion.error(error.error?.mensaje || 'Error al actualizar el estado');
      }
    });
  }

  guardarEdicion(): void {
    if (this.formSolicitud?.invalid) {
      this.formSolicitud.form.markAllAsTouched();
      this.irAPestanaInvalida();
      this.notificacion.error('Complete los campos obligatorios');
      return;
    }

    if (this.fechaFinActividad && this.fechaFinActividad < this.fechaActividad) {
      this.notificacion.error('La fecha fin no puede ser anterior a la fecha de actividad');
      return;
    }

    const data = {
      nombreActividad: this.nombreActividad,
      descripcionActividad: this.descripcionActividad,
      fechaActividad: this.fechaActividad,
      fechaFinActividad: this.fechaFinActividad || this.fechaActividad,
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
        this.notificacion.exito(respuesta.mensaje);
        this.showModal = false;
        this.modoEdicion = false;
        this.solicitudSeleccionada = null;
        this.personalAsignado = [];
        this.cargarSolicitudes();
        this.solicitudService.notificarCambio();
      },
      error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al actualizar')
    });
  }

  private irAPestanaInvalida(): void {
    const orden: { pestana: string; campos: string[] }[] = [
      { pestana: 'datos', campos: ['nombreActividad', 'fechaActividad', 'fechaFinActividad', 'horaInicio', 'horaFin', 'lugarActividad'] },
      { pestana: 'solicitante', campos: ['idSolicitante'] },
      { pestana: 'estado', campos: ['idEstadoActividad', 'idPrioridad'] }
    ];
    for (const seccion of orden) {
      if (seccion.campos.some((c) => this.formSolicitud?.controls[c]?.invalid)) {
        this.pestana = seccion.pestana;
        return;
      }
    }
  }
}
