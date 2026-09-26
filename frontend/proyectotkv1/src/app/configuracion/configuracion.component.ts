import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { CatalogoService } from '../services/catalogo.service';
import { RecursoService } from '../services/recurso.service';
import { AuthService } from '../services/auth.service';
import { NotificacionService } from '../services/notificacion.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent implements OnInit {

  pestanaActiva = 'perfil';

  pestanas = [
    { id: 'perfil', nombre: 'Perfil' },
    { id: 'recursos', nombre: 'Recursos' },
    { id: 'estados-actividad', nombre: 'Estados de Actividad' },
    { id: 'prioridades', nombre: 'Prioridades' },
    { id: 'tipos-recurso', nombre: 'Tipos de Recurso' },
    { id: 'instituciones', nombre: 'Instituciones' },
    { id: 'cargos', nombre: 'Cargos' },
    { id: 'roles', nombre: 'Roles' },
    { id: 'tipos-empleado', nombre: 'Tipos de Empleado' },
    { id: 'estados-usuario', nombre: 'Estados de Usuario' }
  ];

  datos: any[] = [];
  mostrarFormulario = false;
  editando = false;
  idEditar = 0;
  nombreCampo = '';
  descripcionCampo = '';

  // Perfil
  perfil: any = {};
  editandoPerfil = false;

  // Recursos
  mostrarFormularioRecurso = false;
  editandoRecurso = false;
  idEditarRecurso = 0;
  tiposRecurso: any[] = [];
  nombreRecurso = '';
  descripcionRecurso = '';
  estadoRecurso = 'Disponible';
  idTipoRecurso = 0;

  constructor(
    private catalogoService: CatalogoService,
    private recursoService: RecursoService,
    public authService: AuthService,
    private notificacion: NotificacionService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  get pestanasFiltradas(): any[] {
    if (this.authService.esLector()) {
      return this.pestanas.filter(p => p.id === 'perfil');
    }
    return this.pestanas;
  }

  cambiarPestana(pestanha: string): void {
    this.pestanaActiva = pestanha;
    this.mostrarFormulario = false;
    this.mostrarFormularioRecurso = false;
    if (pestanha === 'recursos') {
      this.cargarRecursos();
      this.cargarTiposRecurso();
    } else if (pestanha === 'perfil') {
      this.cargarPerfil();
    } else {
      this.cargarDatos();
    }
  }

  // ===== PERFIL =====
  cargarPerfil(): void {
    this.authService.obtenerPerfil().subscribe({
      next: (datos) => this.perfil = datos,
      error: (error) => console.error('Error:', error)
    });
  }

  editarPerfil(): void {
    this.editandoPerfil = true;
  }

  cancelarEdicionPerfil(): void {
    this.editandoPerfil = false;
    this.cargarPerfil();
  }

  guardarPerfil(): void {
    this.authService.actualizarPerfil(this.perfil).subscribe({
      next: (respuesta) => {
        this.notificacion.exito(respuesta.mensaje);
        this.editandoPerfil = false;
      },
      error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al guardar')
    });
  }

  // ===== CATALOGOS =====
  cargarDatos(): void {
    const method = this.getMethod();
    if (method) {
      method().subscribe({
        next: (datos) => this.datos = datos,
        error: (error) => console.error('Error:', error)
      });
    }
  }

  getMethod(): (() => Observable<any[]>) | null {
    const methods: Record<string, () => Observable<any[]>> = {
      'estados-actividad': () => this.catalogoService.obtenerEstadosActividad(),
      'prioridades': () => this.catalogoService.obtenerPrioridades(),
      'tipos-recurso': () => this.catalogoService.obtenerTiposRecurso(),
      'instituciones': () => this.catalogoService.obtenerInstituciones(),
      'cargos': () => this.catalogoService.obtenerCargos(),
      'roles': () => this.catalogoService.obtenerRoles(),
      'tipos-empleado': () => this.catalogoService.obtenerTiposEmpleado(),
      'estados-usuario': () => this.catalogoService.obtenerEstadosUsuario()
    };
    return methods[this.pestanaActiva] || null;
  }

  get nombrePestanaActual(): string {
    const p = this.pestanas.find(p => p.id === this.pestanaActiva);
    return p ? p.nombre : '';
  }

  getPlaceholder(): string {
    const placeholders: Record<string, string> = {
      'estados-actividad': 'Nombre del estado',
      'prioridades': 'Nombre de la prioridad',
      'tipos-recurso': 'Nombre del tipo de recurso',
      'instituciones': 'Nombre de la institucion',
      'cargos': 'Nombre del cargo',
      'roles': 'Nombre del rol',
      'tipos-empleado': 'Nombre del tipo',
      'estados-usuario': 'Nombre del estado'
    };
    return placeholders[this.pestanaActiva] || 'Nombre';
  }

  getNombreColumna(): string {
    const columnas: Record<string, string> = {
      'estados-actividad': 'nombre_estado',
      'prioridades': 'nombre_prioridad',
      'tipos-recurso': 'nombre_tipo_recurso',
      'instituciones': 'nombre_institucion',
      'cargos': 'nombre_cargo',
      'roles': 'nombre_rol',
      'tipos-empleado': 'nombre_tipo_empleado',
      'estados-usuario': 'nombre_estado_usuario'
    };
    return columnas[this.pestanaActiva] || 'nombre';
  }

  getIdCampo(): string {
    const ids: Record<string, string> = {
      'estados-actividad': 'id_estado_actividad',
      'prioridades': 'id_prioridad',
      'tipos-recurso': 'id_tipo_recurso',
      'instituciones': 'id_institucion',
      'cargos': 'id_cargo',
      'roles': 'id_rol',
      'tipos-empleado': 'id_tipo_empleado',
      'estados-usuario': 'id_estado_usuario'
    };
    return ids[this.pestanaActiva] || 'id';
  }

  nuevo(): void {
    this.editando = false;
    this.idEditar = 0;
    this.nombreCampo = '';
    this.descripcionCampo = '';
    this.mostrarFormulario = true;
  }

  editar(item: any): void {
    this.editando = true;
    this.idEditar = item[this.getIdCampo()];
    this.nombreCampo = item[this.getNombreColumna()];
    this.descripcionCampo = item[`descripcion_${this.pestanaActiva.replace(/-/g, '_')}`] || '';
    this.mostrarFormulario = true;
  }

  guardar(): void {
    const data = { nombre: this.nombreCampo, descripcion: this.descripcionCampo };
    const save$ = this.editando
      ? this.saveMethod()(this.idEditar, data)
      : this.createMethod()(data);

    save$.subscribe({
      next: (respuesta: any) => {
        this.notificacion.exito(respuesta.mensaje);
        this.mostrarFormulario = false;
        this.cargarDatos();
      },
      error: (error: any) => this.notificacion.error(error.error?.mensaje || 'Error al guardar')
    });
  }

  async eliminar(id: number): Promise<void> {
    const confirmado = await this.notificacion.confirmar('Esta seguro de eliminar este registro?');
    if (confirmado) {
      this.deleteMethod()(id).subscribe({
        next: (respuesta: any) => {
          this.notificacion.exito(respuesta.mensaje);
          this.cargarDatos();
        },
        error: (error: any) => this.notificacion.error(error.error?.mensaje || 'Error al eliminar')
      });
    }
  }

  createMethod(): (data: any) => Observable<any> {
    const methods: Record<string, (data: any) => Observable<any>> = {
      'estados-actividad': (d) => this.catalogoService.crearEstadoActividad(d),
      'prioridades': (d) => this.catalogoService.crearPrioridad(d),
      'tipos-recurso': (d) => this.catalogoService.crearTipoRecurso(d),
      'instituciones': (d) => this.catalogoService.crearInstitucion(d),
      'cargos': (d) => this.catalogoService.crearCargo(d),
      'roles': (d) => this.catalogoService.crearRol(d),
      'tipos-empleado': (d) => this.catalogoService.crearTipoEmpleado(d),
      'estados-usuario': (d) => this.catalogoService.crearEstadoUsuario(d)
    };
    return methods[this.pestanaActiva];
  }

  saveMethod(): (id: number, data: any) => Observable<any> {
    const methods: Record<string, (id: number, data: any) => Observable<any>> = {
      'estados-actividad': (id, d) => this.catalogoService.actualizarEstadoActividad(id, d),
      'prioridades': (id, d) => this.catalogoService.actualizarPrioridad(id, d),
      'tipos-recurso': (id, d) => this.catalogoService.actualizarTipoRecurso(id, d),
      'instituciones': (id, d) => this.catalogoService.actualizarInstitucion(id, d),
      'cargos': (id, d) => this.catalogoService.actualizarCargo(id, d),
      'roles': (id, d) => this.catalogoService.actualizarRol(id, d),
      'tipos-empleado': (id, d) => this.catalogoService.actualizarTipoEmpleado(id, d),
      'estados-usuario': (id, d) => this.catalogoService.actualizarEstadoUsuario(id, d)
    };
    return methods[this.pestanaActiva];
  }

  deleteMethod(): (id: number) => Observable<any> {
    const methods: Record<string, (id: number) => Observable<any>> = {
      'estados-actividad': (id) => this.catalogoService.eliminarEstadoActividad(id),
      'prioridades': (id) => this.catalogoService.eliminarPrioridad(id),
      'tipos-recurso': (id) => this.catalogoService.eliminarTipoRecurso(id),
      'instituciones': (id) => this.catalogoService.eliminarInstitucion(id),
      'cargos': (id) => this.catalogoService.eliminarCargo(id),
      'roles': (id) => this.catalogoService.eliminarRol(id),
      'tipos-empleado': (id) => this.catalogoService.eliminarTipoEmpleado(id),
      'estados-usuario': (id) => this.catalogoService.eliminarEstadoUsuario(id)
    };
    return methods[this.pestanaActiva];
  }

  // ===== RECURSOS =====
  cargarRecursos(): void {
    this.recursoService.obtenerTodos().subscribe({
      next: (datos) => this.datos = datos,
      error: (error) => console.error('Error:', error)
    });
  }

  cargarTiposRecurso(): void {
    this.catalogoService.obtenerTiposRecurso().subscribe({
      next: (datos) => this.tiposRecurso = datos,
      error: (error) => console.error('Error:', error)
    });
  }

  nuevoRecurso(): void {
    this.editandoRecurso = false;
    this.idEditarRecurso = 0;
    this.nombreRecurso = '';
    this.descripcionRecurso = '';
    this.estadoRecurso = 'Disponible';
    this.idTipoRecurso = 0;
    this.mostrarFormularioRecurso = true;
  }

  editarRecurso(item: any): void {
    this.editandoRecurso = true;
    this.idEditarRecurso = item.id_recurso;
    this.nombreRecurso = item.nombre_recurso;
    this.descripcionRecurso = item.descripcion_recurso || '';
    this.estadoRecurso = item.estado_recurso;
    this.idTipoRecurso = item.id_tipo_recurso;
    this.mostrarFormularioRecurso = true;
  }

  guardarRecurso(): void {
    const data = {
      nombreRecurso: this.nombreRecurso,
      descripcionRecurso: this.descripcionRecurso,
      estadoRecurso: this.estadoRecurso,
      idTipoRecurso: this.idTipoRecurso
    };

    if (this.editandoRecurso) {
      this.recursoService.actualizar(this.idEditarRecurso, data).subscribe({
        next: (respuesta) => {
          this.notificacion.exito(respuesta.mensaje);
          this.mostrarFormularioRecurso = false;
          this.cargarRecursos();
        },
        error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al actualizar')
      });
    } else {
      this.recursoService.crear(data).subscribe({
        next: (respuesta) => {
          this.notificacion.exito(respuesta.mensaje);
          this.mostrarFormularioRecurso = false;
          this.cargarRecursos();
        },
        error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al crear')
      });
    }
  }

  async eliminarRecurso(id: number): Promise<void> {
    const confirmado = await this.notificacion.confirmar('Esta seguro de eliminar este recurso?');
    if (confirmado) {
      this.recursoService.eliminar(id).subscribe({
        next: (respuesta) => {
          this.notificacion.exito(respuesta.mensaje);
          this.cargarRecursos();
        },
        error: (error) => this.notificacion.error(error.error?.mensaje || 'Error al eliminar')
      });
    }
  }
}
