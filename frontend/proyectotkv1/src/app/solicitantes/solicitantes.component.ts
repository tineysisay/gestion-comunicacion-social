import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitanteService } from '../services/solicitante.service';
import { CatalogoService } from '../services/catalogo.service';

@Component({
  selector: 'app-solicitantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitantes.component.html',
  styleUrl: './solicitantes.component.css'
})
export class SolicitantesComponent implements OnInit {

  mostrarFormulario = false;
  solicitantes: any[] = [];
  instituciones: any[] = [];
  editando = false;
  idEditar = 0;

  primerNombre = '';
  segundoNombre = '';
  primerApellido = '';
  segundoApellido = '';
  telefono = '';
  correoElectronico = '';
  descripcionSolicitante = '';
  idInstitucion = 0;

  constructor(
    private solicitanteService: SolicitanteService,
    private catalogoService: CatalogoService
  ) {}

  ngOnInit(): void {
    this.obtenerSolicitantes();
    this.obtenerInstituciones();
  }

  obtenerSolicitantes(): void {
    this.solicitanteService.obtenerTodos().subscribe({
      next: (datos) => this.solicitantes = datos,
      error: (error) => console.error('Error:', error)
    });
  }

  obtenerInstituciones(): void {
    this.catalogoService.obtenerInstituciones().subscribe({
      next: (datos) => this.instituciones = datos,
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
    this.solicitanteService.obtenerPorId(id).subscribe({
      next: (solicitante) => {
        this.idEditar = solicitante.id_solicitante;
        this.editando = true;
        this.mostrarFormulario = true;
        this.primerNombre = solicitante.primer_nombre;
        this.segundoNombre = solicitante.segundo_nombre || '';
        this.primerApellido = solicitante.primer_apellido;
        this.segundoApellido = solicitante.segundo_apellido || '';
        this.telefono = solicitante.telefono || '';
        this.correoElectronico = solicitante.correo_electronico || '';
        this.descripcionSolicitante = solicitante.descripcion_solicitante || '';
        this.idInstitucion = solicitante.id_institucion || 0;
      },
      error: (error) => console.error('Error:', error)
    });
  }

  guardar(): void {
    const data = {
      primerNombre: this.primerNombre,
      segundoNombre: this.segundoNombre,
      primerApellido: this.primerApellido,
      segundoApellido: this.segundoApellido,
      telefono: this.telefono,
      correoElectronico: this.correoElectronico,
      descripcionSolicitante: this.descripcionSolicitante,
      idInstitucion: this.idInstitucion || null
    };

    if (this.editando) {
      this.solicitanteService.actualizar(this.idEditar, data).subscribe({
        next: (respuesta) => {
          alert(respuesta.mensaje);
          this.mostrarFormulario = false;
          this.obtenerSolicitantes();
        },
        error: (error) => alert(error.error?.mensaje || 'Error al actualizar')
      });
    } else {
      this.solicitanteService.crear(data).subscribe({
        next: (respuesta) => {
          alert(respuesta.mensaje);
          this.mostrarFormulario = false;
          this.obtenerSolicitantes();
        },
        error: (error) => alert(error.error?.mensaje || 'Error al crear')
      });
    }
  }

  eliminar(id: number): void {
    if (confirm('Esta seguro de eliminar este solicitante?')) {
      this.solicitanteService.eliminar(id).subscribe({
        next: (respuesta) => {
          alert(respuesta.mensaje);
          this.obtenerSolicitantes();
        },
        error: (error) => alert(error.error?.mensaje || 'Error al eliminar')
      });
    }
  }

  limpiarFormulario(): void {
    this.primerNombre = '';
    this.segundoNombre = '';
    this.primerApellido = '';
    this.segundoApellido = '';
    this.telefono = '';
    this.correoElectronico = '';
    this.descripcionSolicitante = '';
    this.idInstitucion = 0;
  }
}
