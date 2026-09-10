import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecursoService } from '../services/recurso.service';
import { CatalogoService } from '../services/catalogo.service';

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

  constructor(
    private recursoService: RecursoService,
    private catalogoService: CatalogoService
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
    const data = {
      nombreRecurso: this.nombreRecurso,
      descripcionRecurso: this.descripcionRecurso,
      estadoRecurso: this.estadoRecurso,
      idTipoRecurso: this.idTipoRecurso
    };

    if (this.editando) {
      this.recursoService.actualizar(this.idEditar, data).subscribe({
        next: (respuesta) => {
          alert(respuesta.mensaje);
          this.mostrarFormulario = false;
          this.obtenerRecursos();
        },
        error: (error) => alert(error.error?.mensaje || 'Error al actualizar')
      });
    } else {
      this.recursoService.crear(data).subscribe({
        next: (respuesta) => {
          alert(respuesta.mensaje);
          this.mostrarFormulario = false;
          this.obtenerRecursos();
        },
        error: (error) => alert(error.error?.mensaje || 'Error al crear')
      });
    }
  }

  eliminar(id: number): void {
    if (confirm('Esta seguro de eliminar este recurso?')) {
      this.recursoService.eliminar(id).subscribe({
        next: (respuesta) => {
          alert(respuesta.mensaje);
          this.obtenerRecursos();
        },
        error: (error) => alert(error.error?.mensaje || 'Error al eliminar')
      });
    }
  }

  limpiarFormulario(): void {
    this.nombreRecurso = '';
    this.descripcionRecurso = '';
    this.estadoRecurso = 'Disponible';
    this.idTipoRecurso = 0;
  }
}
