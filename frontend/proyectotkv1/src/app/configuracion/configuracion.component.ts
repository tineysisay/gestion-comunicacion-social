import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { CatalogoService } from '../services/catalogo.service';
import { AuthService } from '../services/auth.service';
import { NotificacionService } from '../services/notificacion.service';
import { ApiService } from '../services/api.service';

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
    { id: 'base-datos', nombre: 'Base de Datos' },
    { id: 'estados-actividad', nombre: 'Estados de Actividad' },
    { id: 'prioridades', nombre: 'Prioridades' },
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

  // Backup de base de datos
  generandoBackup = false;

  constructor(
    private catalogoService: CatalogoService,
    public authService: AuthService,
    private notificacion: NotificacionService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    if (this.pestanaActiva === 'perfil') {
      this.cargarPerfil();
    } else {
      this.cargarDatos();
    }
  }

  get pestanasFiltradas(): any[] {
    if (this.authService.esLector()) {
      return this.pestanas.filter(p => p.id === 'perfil');
    }
    // Base de Datos: solo administrador (el endpoint esta protegido con soloAdmin)
    return this.pestanas.filter(p => p.id !== 'base-datos' || this.authService.esAdmin());
  }

  cambiarPestana(pestanha: string): void {
    this.pestanaActiva = pestanha;
    this.mostrarFormulario = false;
    if (pestanha === 'perfil') {
      this.cargarPerfil();
    } else if (pestanha !== 'base-datos') {
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

  // ===== BACKUP DE BASE DE DATOS =====
  generarBackup(): void {
    if (this.generandoBackup) {
      return;
    }
    this.generandoBackup = true;

    this.apiService.descargar('backup').subscribe({
      next: (blob) => {
        // El backend devuelve Content-Disposition con el nombre; aqui se arma uno equivalente
        let nombreArchivo = 'backup.sql';
        const fecha = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        nombreArchivo = `backup_gestion_comunicacion_social_${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}_${pad(fecha.getHours())}${pad(fecha.getMinutes())}${pad(fecha.getSeconds())}.sql`;

        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombreArchivo;
        enlace.click();
        window.URL.revokeObjectURL(url);

        this.generandoBackup = false;
        this.notificacion.exito('Backup generado. El archivo se descargo a tu equipo y quedo guardado en el servidor (backend/backups)');
      },
      error: (error) => {
        this.generandoBackup = false;
        let mensaje = 'Error al generar el backup';
        if (error?.error instanceof Blob) {
          // El backend responde JSON en caso de error
          error.error.text().then((texto: string) => {
            try {
              this.notificacion.error(JSON.parse(texto).mensaje || mensaje);
            } catch {
              this.notificacion.error(mensaje);
            }
          });
        } else {
          this.notificacion.error(error?.error?.mensaje || mensaje);
        }
      }
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
      'cargos': 'nombre_cargo',
      'roles': 'nombre_rol',
      'tipos-empleado': 'nombre_tipo_empleado',
      'estados-usuario': 'nombre_estado'
    };
    return columnas[this.pestanaActiva] || 'nombre';
  }

  getIdCampo(): string {
    const ids: Record<string, string> = {
      'estados-actividad': 'id_estado_actividad',
      'prioridades': 'id_prioridad',
      'cargos': 'id_cargo',
      'roles': 'id_rol',
      'tipos-empleado': 'id_tipo_empleado',
      'estados-usuario': 'id_estado_usuario'
    };
    return ids[this.pestanaActiva] || 'id';
  }

  getDescripcionColumna(): string {
    const columnas: Record<string, string> = {
      'estados-actividad': 'descripcion_estado',
      'prioridades': 'descripcion_prioridad',
      'cargos': 'descripcion_cargo',
      'roles': 'descripcion_rol',
      'tipos-empleado': 'descripcion_tipo_empleado',
      'estados-usuario': 'descripcion_estado'
    };
    return columnas[this.pestanaActiva] || 'descripcion';
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
    this.descripcionCampo = item[this.getDescripcionColumna()] || '';
    this.mostrarFormulario = true;
  }

  guardar(): void {
    const data = this.construirPayload();
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

  // El backend espera nombres de campo especificos por catalogo
  // (ej. nombreTipoRecurso, nombreEstado), no "nombre"/"descripcion"
  construirPayload(): any {
    const nombre = this.nombreCampo;
    const descripcion = this.descripcionCampo;
    const payloads: Record<string, any> = {
      'estados-actividad': { nombre, descripcion, nombreEstado: nombre, descripcionEstado: descripcion },
      'prioridades': { nombre, descripcion, nombrePrioridad: nombre, descripcionPrioridad: descripcion },
      'cargos': { nombre, descripcion, nombreCargo: nombre, descripcionCargo: descripcion },
      'roles': { nombre, descripcion, nombreRol: nombre, descripcionRol: descripcion },
      'tipos-empleado': { nombre, descripcion, nombreTipoEmpleado: nombre, descripcionTipoEmpleado: descripcion },
      'estados-usuario': { nombre, descripcion, nombreEstado: nombre, descripcionEstado: descripcion }
    };
    return payloads[this.pestanaActiva] || { nombre, descripcion };
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
      'cargos': (id) => this.catalogoService.eliminarCargo(id),
      'roles': (id) => this.catalogoService.eliminarRol(id),
      'tipos-empleado': (id) => this.catalogoService.eliminarTipoEmpleado(id),
      'estados-usuario': (id) => this.catalogoService.eliminarEstadoUsuario(id)
    };
    return methods[this.pestanaActiva];
  }
}
