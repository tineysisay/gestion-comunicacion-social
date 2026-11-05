import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitanteService } from '../services/solicitante.service';
import { CatalogoService } from '../services/catalogo.service';
import { NotificacionService } from '../services/notificacion.service';

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
  textoBusqueda = '';
  filtroInstitucion = '';

  constructor(
    private solicitanteService: SolicitanteService,
    private catalogoService: CatalogoService,
    private notificacion: NotificacionService
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

  get institucionesFiltradas(): any[] {
    const termino = this.filtroInstitucion.toLowerCase().trim();
    if (!termino) return this.instituciones;
    const filtradas = this.instituciones.filter(i =>
      i.nombre_institucion?.toLowerCase().includes(termino)
    );
    const seleccionada = this.instituciones.find(i => i.id_institucion === this.idInstitucion);
    if (seleccionada && !filtradas.includes(seleccionada)) {
      filtradas.unshift(seleccionada);
    }
    return filtradas;
  }

  get solicitantesFiltradas(): any[] {
    if (!this.textoBusqueda.trim()) return this.solicitantes;
    const termino = this.textoBusqueda.toLowerCase().trim();
    return this.solicitantes.filter(s =>
      s.primer_nombre?.toLowerCase().includes(termino) ||
      s.segundo_nombre?.toLowerCase().includes(termino) ||
      s.primer_apellido?.toLowerCase().includes(termino) ||
      s.segundo_apellido?.toLowerCase().includes(termino) ||
      s.nombre_institucion?.toLowerCase().includes(termino)
    );
  }

  paginaActual = 1;
  porPagina = 10;

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.solicitantesFiltradas.length / this.porPagina));
  }

  get solicitantesPaginados(): any[] {
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas;
    }
    const inicio = (this.paginaActual - 1) * this.porPagina;
    return this.solicitantesFiltradas.slice(inicio, inicio + this.porPagina);
  }

  cambiarBusqueda(): void {
    this.paginaActual = 1;
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) this.paginaActual--;
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) this.paginaActual++;
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  get paginasVisibles(): number[] {
    const total = this.totalPaginas;
    const actual = this.paginaActual;
    const inicio = Math.max(1, Math.min(actual - 2, total - 4));
    const fin = Math.min(total, inicio + 4);
    const paginas: number[] = [];
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    return paginas;
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
          this.notificacion.exito(respuesta.mensaje);
          this.mostrarFormulario = false;
          this.obtenerSolicitantes();
        },
        error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al actualizar')
      });
    } else {
      this.solicitanteService.crear(data).subscribe({
        next: (respuesta) => {
          this.notificacion.exito(respuesta.mensaje);
          this.mostrarFormulario = false;
          this.obtenerSolicitantes();
        },
        error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al crear')
      });
    }
  }

  async eliminar(id: number): Promise<void> {
    const confirmado = await this.notificacion.confirmar('Esta seguro de eliminar este solicitante?');
    if (confirmado) {
      this.solicitanteService.eliminar(id).subscribe({
        next: (respuesta) => {
          this.notificacion.exito(respuesta.mensaje);
          this.obtenerSolicitantes();
        },
        error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al eliminar')
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

  mostrarNuevaInstitucion = false;
  nombreNuevaInstitucion = '';
  representanteInst = '';
  telRepresentanteInst = '';
  telInstitucionInst = '';
  correoInst = '';
  direccionInst = '';
  descripcionInst = '';

  guardarInstitucion(): void {
    const nombre = this.nombreNuevaInstitucion.trim();
    if (!nombre) {
      this.notificacion.error('Ingrese el nombre de la institución');
      return;
    }
    this.catalogoService.crearInstitucion({
      nombreInstitucion: nombre,
      representante: this.representanteInst.trim() || null,
      telRepresentante: this.telRepresentanteInst.trim() || null,
      telInstitucion: this.telInstitucionInst.trim() || null,
      correoElectronico: this.correoInst.trim() || null,
      direccion: this.direccionInst.trim() || null,
      descripcionInstitucion: this.descripcionInst.trim() || null
    }).subscribe({
      next: (respuesta) => {
        this.notificacion.exito(respuesta.mensaje);
        this.cerrarNuevaInstitucion();
        this.obtenerInstituciones();
        this.idInstitucion = respuesta.id;
      },
      error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al crear la institución')
    });
  }

  cerrarNuevaInstitucion(): void {
    this.mostrarNuevaInstitucion = false;
    this.nombreNuevaInstitucion = '';
    this.representanteInst = '';
    this.telRepresentanteInst = '';
    this.telInstitucionInst = '';
    this.correoInst = '';
    this.direccionInst = '';
    this.descripcionInst = '';
  }
}
