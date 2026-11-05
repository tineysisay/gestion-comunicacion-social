import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecursoService } from '../services/recurso.service';
import { CatalogoService } from '../services/catalogo.service';
import { NotificacionService } from '../services/notificacion.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-recursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recursos.component.html',
  styleUrl: './recursos.component.css'
})
export class RecursosComponent implements OnInit {

  mostrarFormulario = false;
  recursos: any[] = [];
  tiposRecurso: any[] = [];
  editando = false;
  idEditar = 0;

  nombreRecurso = '';
  descripcionRecurso = '';
  estadoRecurso = 'Disponible';
  idTipoRecurso = 0;

  mostrarFormTipo = false;
  nombreTipoNuevo = '';
  descripcionTipoNuevo = '';

  constructor(
    private recursoService: RecursoService,
    private catalogoService: CatalogoService,
    private notificacion: NotificacionService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.obtenerRecursos();
    this.obtenerTiposRecurso();
  }

  obtenerRecursos(): void {
    this.recursoService.obtenerTodos().subscribe({
      next: (datos) => this.recursos = datos,
      error: (error) => console.error('Error:', error)
    });
  }

  obtenerTiposRecurso(): void {
    this.catalogoService.obtenerTiposRecurso().subscribe({
      next: (datos) => this.tiposRecurso = datos,
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
    this.recursoService.obtenerPorId(id).subscribe({
      next: (recurso) => {
        this.idEditar = recurso.id_recurso;
        this.editando = true;
        this.mostrarFormulario = true;
        this.nombreRecurso = recurso.nombre_recurso;
        this.descripcionRecurso = recurso.descripcion_recurso || '';
        this.estadoRecurso = recurso.estado_recurso;
        this.idTipoRecurso = recurso.id_tipo_recurso;
      },
      error: (error) => console.error('Error:', error)
    });
  }

  guardar(): void {
    if (!this.nombreRecurso.trim()) {
      this.notificacion.error('Ingrese el nombre del recurso');
      return;
    }
    if (!this.idTipoRecurso) {
      this.notificacion.error('Seleccione el tipo de recurso');
      return;
    }

    const data = {
      nombreRecurso: this.nombreRecurso,
      descripcionRecurso: this.descripcionRecurso,
      estadoRecurso: this.estadoRecurso,
      idTipoRecurso: this.idTipoRecurso
    };

    if (this.editando) {
      this.recursoService.actualizar(this.idEditar, data).subscribe({
        next: (respuesta) => {
          this.notificacion.exito(respuesta.mensaje);
          this.mostrarFormulario = false;
          this.obtenerRecursos();
        },
        error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al actualizar')
      });
    } else {
      this.recursoService.crear(data).subscribe({
        next: (respuesta) => {
          this.notificacion.exito(respuesta.mensaje);
          this.mostrarFormulario = false;
          this.obtenerRecursos();
        },
        error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al crear')
      });
    }
  }

  async eliminar(id: number): Promise<void> {
    const confirmado = await this.notificacion.confirmar('Esta seguro de eliminar este recurso?');
    if (confirmado) {
      this.recursoService.eliminar(id).subscribe({
        next: (respuesta) => {
          this.notificacion.exito(respuesta.mensaje);
          this.obtenerRecursos();
        },
        error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al eliminar')
      });
    }
  }

  limpiarFormulario(): void {
    this.nombreRecurso = '';
    this.descripcionRecurso = '';
    this.estadoRecurso = 'Disponible';
    this.idTipoRecurso = 0;
    this.cancelarFormTipo();
  }

  // ===== TIPO DE RECURSO RAPIDO =====
  abrirFormTipo(): void {
    this.nombreTipoNuevo = '';
    this.descripcionTipoNuevo = '';
    this.mostrarFormTipo = true;
  }

  cancelarFormTipo(): void {
    this.mostrarFormTipo = false;
    this.nombreTipoNuevo = '';
    this.descripcionTipoNuevo = '';
  }

  guardarTipo(): void {
    if (!this.nombreTipoNuevo.trim()) {
      this.notificacion.error('Ingrese el nombre del tipo de recurso');
      return;
    }

    this.catalogoService.crearTipoRecurso({
      nombreTipoRecurso: this.nombreTipoNuevo.trim(),
      descripcionTipoRecurso: this.descripcionTipoNuevo.trim() || null
    }).subscribe({
      next: (respuesta) => {
        this.notificacion.exito(respuesta.mensaje);
        this.idTipoRecurso = respuesta.id;
        this.cancelarFormTipo();
        this.obtenerTiposRecurso();
      },
      error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al crear el tipo de recurso')
    });
  }
}
