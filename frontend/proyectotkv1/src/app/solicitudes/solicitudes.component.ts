import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudService } from '../services/solicitud.service';
import { CatalogoService } from '../services/catalogo.service';
import { SolicitanteService } from '../services/solicitante.service';
import { RecursoService } from '../services/recurso.service';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
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

  // Accordion sections
  seccionDatos = true;
  seccionSolicitante = false;
  seccionResponsable = false;
  seccionEstado = false;

  nombreActividad = '';
  descripcionActividad = '';
  fechaActividad = '';
  horaInicio = '';
  horaFin = '';
  lugarActividad = '';
  idSolicitante = 0;
  idEstadoActividad = 0;
  idPrioridad = 0;

  idUsuarioAsignar = 0;
  idRecursoAsignar = 0;
  personalAsignado: number[] = [];

  constructor(
    private solicitudService: SolicitudService,
    private catalogoService: CatalogoService,
    private solicitanteService: SolicitanteService,
    private recursoService: RecursoService,
    private api: ApiService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.obtenerSolicitudes();
    this.obtenerSolicitantes();
    this.obtenerEstadosActividad();
    this.obtenerPrioridades();
    this.obtenerUsuarios();
    this.obtenerRecursos();
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

  nuevo(): void {
    this.editando = false;
    this.idEditar = 0;
    this.limpiarFormulario();
    this.mostrarFormulario = true;
  }

  editar(id: number): void {
    this.solicitudService.obtenerPorId(id).subscribe({
      next: (solicitud) => {
        this.idEditar = solicitud.id_solicitud;
        this.editando = true;
        this.mostrarFormulario = true;
        this.nombreActividad = solicitud.nombre_actividad;
        this.descripcionActividad = solicitud.descripcion_actividad || '';
        this.fechaActividad = solicitud.fecha_actividad;
        this.horaInicio = solicitud.hora_inicio;
        this.horaFin = solicitud.hora_fin;
        this.lugarActividad = solicitud.lugar_actividad;
        this.idSolicitante = solicitud.id_solicitante;
        this.idEstadoActividad = solicitud.id_estado_actividad;
        this.idPrioridad = solicitud.id_prioridad;

        this.solicitudService.obtenerAsignacionesUsuario(id).subscribe({
          next: (asignaciones) => {
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

    if (this.editando) {
      this.solicitudService.actualizar(this.idEditar, data).subscribe({
        next: (respuesta) => {
          alert(respuesta.mensaje);
          this.mostrarFormulario = false;
          this.obtenerSolicitudes();
          this.solicitudService.notificarCambio();
        },
        error: (error) => alert(error.error?.mensaje || 'Error al actualizar')
      });
    } else {
      this.solicitudService.crear(data).subscribe({
        next: (respuesta) => {
          alert(respuesta.mensaje);
          this.mostrarFormulario = false;
          this.obtenerSolicitudes();
          this.solicitudService.notificarCambio();
        },
        error: (error) => alert(error.error?.mensaje || 'Error al crear')
      });
    }
  }

  eliminar(id: number): void {
    if (confirm('Esta seguro de eliminar esta solicitud?')) {
      this.solicitudService.eliminar(id).subscribe({
        next: (respuesta) => {
          alert(respuesta.mensaje);
          this.obtenerSolicitudes();
          this.solicitudService.notificarCambio();
        },
        error: (error) => alert(error.error?.mensaje || 'Error al eliminar')
      });
    }
  }

  asignarPersonal(): void {
    if (this.idUsuarioAsignar === 0) return;
    this.solicitudService.asignarUsuario(this.solicitudActual.id_solicitud, {
      idUsuario: this.idUsuarioAsignar
    }).subscribe({
      next: (respuesta) => {
        alert(respuesta.mensaje);
        this.verDetalle(this.solicitudActual.id_solicitud);
        this.idUsuarioAsignar = 0;
      },
      error: (error) => alert(error.error?.mensaje || 'Error al asignar')
    });
  }

  eliminarAsignacionUsuario(idAsignacion: number): void {
    this.solicitudService.eliminarAsignacionUsuario(this.solicitudActual.id_solicitud, idAsignacion).subscribe({
      next: () => this.verDetalle(this.solicitudActual.id_solicitud),
      error: (error) => alert(error.error?.mensaje || 'Error al eliminar')
    });
  }

  asignarRecurso(): void {
    if (this.idRecursoAsignar === 0) return;
    this.solicitudService.asignarRecurso(this.solicitudActual.id_solicitud, {
      idRecurso: this.idRecursoAsignar,
      cantidad: 1
    }).subscribe({
      next: (respuesta) => {
        alert(respuesta.mensaje);
        this.verDetalle(this.solicitudActual.id_solicitud);
        this.idRecursoAsignar = 0;
      },
      error: (error) => alert(error.error?.mensaje || 'Error al asignar')
    });
  }

  eliminarAsignacionRecurso(idAsignacion: number): void {
    this.solicitudService.eliminarAsignacionRecurso(this.solicitudActual.id_solicitud, idAsignacion).subscribe({
      next: () => this.verDetalle(this.solicitudActual.id_solicitud),
      error: (error) => alert(error.error?.mensaje || 'Error al eliminar')
    });
  }

  cambiarEstado(idEstado: number): void {
    const solicitud = this.solicitudActual;
    this.solicitudService.cambiarEstado(solicitud.id_solicitud, {
      idEstadoAnterior: solicitud.id_estado_actividad,
      idEstadoNuevo: idEstado
    }).subscribe({
      next: (respuesta) => {
        alert(respuesta.mensaje);
        this.obtenerSolicitudes();
        this.verDetalle(solicitud.id_solicitud);
        this.solicitudService.notificarCambio();
      },
      error: (error) => alert(error.error?.mensaje || 'Error al cambiar estado')
    });
  }

  limpiarFormulario(): void {
    this.nombreActividad = '';
    this.descripcionActividad = '';
    this.fechaActividad = '';
    this.horaInicio = '';
    this.horaFin = '';
    this.lugarActividad = '';
    this.idSolicitante = 0;
    this.idEstadoActividad = 0;
    this.idPrioridad = 0;
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
}
