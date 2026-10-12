import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SolicitudService } from '../services/solicitud.service';
import { CatalogoService } from '../services/catalogo.service';
import { SolicitanteService } from '../services/solicitante.service';
import { RecursoService } from '../services/recurso.service';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { NotificacionService } from '../services/notificacion.service';
import { FormatoFechaPipe } from '../pipes/formato-fecha.pipe';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatoFechaPipe],
  templateUrl: './solicitudes.component.html',
  styleUrl: './solicitudes.component.css'
})
export class SolicitudesComponent implements OnInit {

  mostrarFormulario = false;
  mostrarDetalle = false;
  solicitudes: any[] = [];
  solicitantes: any[] = [];
  estadosActividad: any[] = [];
  prioridades: any[] = [];
  usuarios: any[] = [];
  recursos: any[] = [];
  solicitudActual: any = null;

  editando = false;
  idEditar = 0;

  // Pestañas del formulario
  pestana = 'datos';

  @ViewChild('formSolicitud') formSolicitud!: NgForm;

  nombreActividad = '';
  descripcionActividad = '';
  fechaCreacion = '';
  fechaActividad = '';
  fechaFinActividad = '';
  horaInicio = '';
  horaFin = '';
  lugarActividad = '';
  idSolicitante = 0;
  idEstadoActividad = 0;
  idPrioridad = 0;

  idUsuarioAsignar = 0;
  idRecursoAsignar = 0;
  personalAsignado: number[] = [];
  responsablesAsignados: any[] = [];
  textoBusqueda = '';

  constructor(
    private solicitudService: SolicitudService,
    private catalogoService: CatalogoService,
    private solicitanteService: SolicitanteService,
    private recursoService: RecursoService,
    private api: ApiService,
    public authService: AuthService,
    private notificacion: NotificacionService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.obtenerSolicitudes();
    this.obtenerSolicitantes();
    this.obtenerEstadosActividad();
    this.obtenerPrioridades();
    this.obtenerUsuarios();
    this.obtenerRecursos();

    // Apertura automatica del formulario: /inicio/solicitudes?nueva=true
    this.route.queryParams.subscribe((params) => {
      if (params['nueva'] === 'true' && this.authService.esAdmin()) {
        this.nuevo();
      }
    });
  }

  obtenerSolicitudes(): void {
    this.solicitudService.obtenerTodas().subscribe({
      next: (datos) => this.solicitudes = datos,
      error: (error) => console.error('Error:', error)
    });
  }

  obtenerSolicitantes(): void {
    this.solicitanteService.obtenerTodos().subscribe({
      next: (datos) => this.solicitantes = datos,
      error: (error) => console.error('Error:', error)
    });
  }

  obtenerEstadosActividad(): void {
    this.catalogoService.obtenerEstadosActividad().subscribe({
      next: (datos) => this.estadosActividad = datos,
      error: (error) => console.error('Error:', error)
    });
  }

  obtenerPrioridades(): void {
    this.catalogoService.obtenerPrioridades().subscribe({
      next: (datos) => this.prioridades = datos,
      error: (error) => console.error('Error:', error)
    });
  }

  obtenerUsuarios(): void {
    this.api.get<any[]>('usuarios').subscribe({
      next: (datos) => this.usuarios = datos,
      error: (error) => console.error('Error:', error)
    });
  }

  obtenerRecursos(): void {
    this.recursoService.obtenerTodos().subscribe({
      next: (datos) => this.recursos = datos,
      error: (error) => console.error('Error:', error)
    });
  }

  get solicitudesFiltradas(): any[] {
    if (!this.textoBusqueda.trim()) return this.solicitudes;
    const termino = this.textoBusqueda.toLowerCase().trim();
    return this.solicitudes.filter(s =>
      s.nombre_actividad?.toLowerCase().includes(termino) ||
      s.descripcion_actividad?.toLowerCase().includes(termino) ||
      s.lugar_actividad?.toLowerCase().includes(termino) ||
      s.nombre_solicitante?.toLowerCase().includes(termino) ||
      s.nombre_responsable?.toLowerCase().includes(termino) ||
      s.estado?.toLowerCase().includes(termino)
    );
  }

  nuevo(): void {
    this.editando = false;
    this.idEditar = 0;
    this.limpiarFormulario();
    this.pestana = 'datos';
    this.mostrarFormulario = true;
  }

  editar(id: number): void {
    this.personalAsignado = [];
    this.responsablesAsignados = [];
    this.pestana = 'datos';
    this.solicitudService.obtenerPorId(id).subscribe({
      next: (solicitud) => {
        this.idEditar = solicitud.id_solicitud;
        this.editando = true;
        this.mostrarFormulario = true;
        this.nombreActividad = solicitud.nombre_actividad;
        this.descripcionActividad = solicitud.descripcion_actividad || '';
        this.fechaCreacion = solicitud.fecha_creacion ? solicitud.fecha_creacion.substring(0, 10) : this.hoy();
        this.fechaActividad = solicitud.fecha_actividad ? solicitud.fecha_actividad.substring(0, 10) : '';
        this.fechaFinActividad = solicitud.fecha_fin_actividad
          ? solicitud.fecha_fin_actividad.substring(0, 10)
          : (solicitud.fecha_actividad ? solicitud.fecha_actividad.substring(0, 10) : '');
        this.horaInicio = solicitud.hora_inicio;
        this.horaFin = solicitud.hora_fin;
        this.lugarActividad = solicitud.lugar_actividad;
        this.idSolicitante = solicitud.id_solicitante;
        this.idEstadoActividad = solicitud.id_estado_actividad;
        this.idPrioridad = solicitud.id_prioridad;

        this.solicitudService.obtenerAsignacionesUsuario(id).subscribe({
          next: (asignaciones) => {
            this.responsablesAsignados = asignaciones;
            this.personalAsignado = asignaciones.map((a: any) => a.id_usuario);
          },
          error: (err) => console.error('Error al cargar asignaciones', err)
        });
      },
      error: (error) => console.error('Error:', error)
    });
  }

  verDetalle(id: number): void {
    this.solicitudService.obtenerPorId(id).subscribe({
      next: (solicitud) => {
        this.solicitudActual = solicitud;
        this.mostrarDetalle = true;
      },
      error: (error) => console.error('Error:', error)
    });
  }

  guardar(): void {
    if (this.formSolicitud?.invalid) {
      this.formSolicitud.form.markAllAsTouched();
      this.irAPestanaInvalida();
      this.notificacion.error('Complete los campos obligatorios');
      return;
    }

    if (!this.fechaActividad || !this.fechaFinActividad) {
      this.notificacion.error('Seleccione la fecha de actividad y la fecha fin');
      return;
    }

    if (this.fechaFinActividad && this.fechaFinActividad < this.fechaActividad) {
      this.notificacion.error('La fecha fin no puede ser anterior a la fecha de actividad');
      return;
    }

    const data = {
      nombreActividad: this.nombreActividad,
      descripcionActividad: this.descripcionActividad,
      fechaCreacion: this.fechaCreacion,
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

    if (this.editando) {
      this.solicitudService.actualizar(this.idEditar, data).subscribe({
        next: (respuesta) => {
          this.notificacion.exito(respuesta.mensaje);
          this.mostrarFormulario = false;
          this.obtenerSolicitudes();
          this.solicitudService.notificarCambio();
        },
        error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al actualizar')
      });
    } else {
      this.solicitudService.crear(data).subscribe({
        next: (respuesta) => {
          this.notificacion.exito(respuesta.mensaje);
          this.mostrarFormulario = false;
          this.obtenerSolicitudes();
          this.solicitudService.notificarCambio();
        },
        error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al crear')
      });
    }
  }

  private irAPestanaInvalida(): void {
    const orden: { pestana: string; campos: string[] }[] = [
      { pestana: 'datos', campos: ['nombreActividad', 'fechaCreacion', 'fechaActividad', 'fechaFinActividad', 'horaInicio', 'horaFin', 'lugarActividad'] },
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

  async eliminar(id: number): Promise<void> {
    const confirmado = await this.notificacion.confirmar('Esta seguro de eliminar esta solicitud?');
    if (confirmado) {
      this.solicitudService.eliminar(id).subscribe({
        next: (respuesta) => {
          this.notificacion.exito(respuesta.mensaje);
          this.obtenerSolicitudes();
          this.solicitudService.notificarCambio();
        },
        error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al eliminar')
      });
    }
  }

  asignarPersonal(): void {
    if (this.idUsuarioAsignar === 0) return;
    this.solicitudService.asignarUsuario(this.solicitudActual.id_solicitud, {
      idUsuario: this.idUsuarioAsignar
    }).subscribe({
      next: (respuesta) => {
        this.notificacion.exito(respuesta.mensaje);
        this.verDetalle(this.solicitudActual.id_solicitud);
        this.idUsuarioAsignar = 0;
      },
      error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al asignar')
    });
  }

  eliminarAsignacionUsuario(idAsignacion: number): void {
    this.solicitudService.eliminarAsignacionUsuario(this.solicitudActual.id_solicitud, idAsignacion).subscribe({
      next: () => this.verDetalle(this.solicitudActual.id_solicitud),
      error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al eliminar')
    });
  }

  asignarRecurso(): void {
    if (this.idRecursoAsignar === 0) return;
    this.solicitudService.asignarRecurso(this.solicitudActual.id_solicitud, {
      idRecurso: this.idRecursoAsignar,
      cantidad: 1
    }).subscribe({
      next: (respuesta) => {
        this.notificacion.exito(respuesta.mensaje);
        this.verDetalle(this.solicitudActual.id_solicitud);
        this.idRecursoAsignar = 0;
      },
      error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al asignar')
    });
  }

  eliminarAsignacionRecurso(idAsignacion: number): void {
    this.solicitudService.eliminarAsignacionRecurso(this.solicitudActual.id_solicitud, idAsignacion).subscribe({
      next: () => this.verDetalle(this.solicitudActual.id_solicitud),
      error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al eliminar')
    });
  }

  cambiarEstado(idEstado: number): void {
    const solicitud = this.solicitudActual;
    this.solicitudService.cambiarEstado(solicitud.id_solicitud, {
      idEstadoAnterior: solicitud.id_estado_actividad,
      idEstadoNuevo: idEstado
    }).subscribe({
      next: (respuesta) => {
        this.notificacion.exito(respuesta.mensaje);
        this.obtenerSolicitudes();
        this.verDetalle(solicitud.id_solicitud);
        this.solicitudService.notificarCambio();
      },
      error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al cambiar estado')
    });
  }

  limpiarFormulario(): void {
    this.nombreActividad = '';
    this.descripcionActividad = '';
    this.fechaCreacion = this.hoy();
    this.fechaActividad = '';
    this.fechaFinActividad = '';
    this.horaInicio = '';
    this.horaFin = '';
    this.lugarActividad = '';
    this.idSolicitante = 0;
    this.idEstadoActividad = 0;
    this.idPrioridad = 0;
    this.personalAsignado = [];
    this.responsablesAsignados = [];
  }

  // Responsables ya asignados que no aparecen en la lista de usuarios activos
  get responsablesExtra(): any[] {
    return this.responsablesAsignados.filter(
      (a) => !this.usuarios.some((u) => u.id_usuario === a.id_usuario)
    );
  }

  hoy(): string {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
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
}
