import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { NotificacionService } from '../services/notificacion.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {

  mostrarFormulario = false;
  usuarios: any[] = [];

  // Modal de credenciales temporales (tras crear o restablecer una cuenta)
  modalTemporal = false;
  contrasenaTemporal = '';
  nombreUsuarioTemporal = '';

  tiposEmpleado: any[] = [];
  cargos: any[] = [];
  roles: any[] = [];
  estadosUsuario: any[] = [];

  editando = false;
  idCuentaEditar = 0;

  primerNombre = '';
  segundoNombre = '';
  primerApellido = '';
  segundoApellido = '';
  dpi = '';
  telefono = '';
  correoElectronico = '';

  idTipoEmpleado = 0;
  idCargo = 0;

  nombreUsuario = '';
  idRol = 0;
  idEstadoUsuario = 0;

  constructor(
    private api: ApiService,
    private notificacion: NotificacionService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.obtenerUsuarios();
    this.obtenerTiposEmpleado();
    this.obtenerCargos();
    this.obtenerRoles();
    this.obtenerEstadosUsuario();
  }

  obtenerUsuarios(): void {
    this.api.get<any[]>('usuarios').subscribe({
      next: (datos) => {
        this.usuarios = datos;
      },
      error: (error: any) => {
        console.error('Error al obtener usuarios:', error);
      }
    });
  }

  esCuentaProtegida(idRol: number): boolean {
    return idRol === 7 && !this.authService.esDesarrollador();
  }

  obtenerTiposEmpleado(): void {
    this.api.get<any[]>('tipos-empleado').subscribe({
      next: (datos) => {
        this.tiposEmpleado = datos;
      },
      error: (error: any) => {
        console.error('Error al obtener tipos de empleado:', error);
      }
    });
  }

  obtenerCargos(): void {
    this.api.get<any[]>('cargos').subscribe({
      next: (datos) => {
        this.cargos = datos;
      },
      error: (error: any) => {
        console.error('Error al obtener cargos:', error);
      }
    });
  }

  obtenerRoles(): void {
    this.api.get<any[]>('roles').subscribe({
      next: (datos) => {
        this.roles = datos;
      },
      error: (error: any) => {
        console.error('Error al obtener roles:', error);
      }
    });
  }

  obtenerEstadosUsuario(): void {
    this.api.get<any[]>('estados-usuario').subscribe({
      next: (datos) => {
        this.estadosUsuario = datos;
      },
      error: (error: any) => {
        console.error('Error al obtener estados:', error);
      }
    });
  }

  editarUsuario(idCuenta: number): void {

    this.api.get<any>(`usuarios/${idCuenta}`).subscribe({

      next: (usuario) => {

        this.idCuentaEditar = usuario.id_cuenta;
        this.editando = true;
        this.mostrarFormulario = true;

        this.primerNombre = usuario.primer_nombre;
        this.segundoNombre = usuario.segundo_nombre;
        this.primerApellido = usuario.primer_apellido;
        this.segundoApellido = usuario.segundo_apellido;
        this.dpi = usuario.dpi;
        this.telefono = usuario.telefono;
        this.correoElectronico = usuario.correo_electronico;

        this.idTipoEmpleado = usuario.id_tipo_empleado;
        this.idCargo = usuario.id_cargo;

        this.nombreUsuario = usuario.nombre_usuario;
        this.idRol = usuario.id_rol;
        this.idEstadoUsuario = usuario.id_estado_usuario;

      },

      error: (error: any) => {

        console.error('Error al obtener usuario:', error);

        this.notificacion.error(
          error.error?.mensaje ||
          'No se pudo cargar el usuario'
        );

      }

    });

  }

  guardarUsuario(): void {

    const usuario = {
      primerNombre: this.primerNombre,
      segundoNombre: this.segundoNombre,
      primerApellido: this.primerApellido,
      segundoApellido: this.segundoApellido,
      dpi: this.dpi,
      telefono: this.telefono,
      correoElectronico: this.correoElectronico,
      idTipoEmpleado: this.idTipoEmpleado,
      idCargo: this.idCargo,
      nombreUsuario: this.nombreUsuario,
      idRol: this.idRol,
      idEstadoUsuario: this.idEstadoUsuario
    };

    if (this.editando) {

      this.api.put(
        `usuarios/${this.idCuentaEditar}`,
        usuario
      ).subscribe({

        next: (respuesta: any) => {

          this.notificacion.exito(respuesta.mensaje);

          this.mostrarFormulario = false;

          this.limpiarFormulario();

          this.obtenerUsuarios();

        },

        error: (error: any) => {

          console.error('Error al actualizar usuario:', error);

          this.notificacion.error(
            error.error?.mensaje ||
            'No se pudo actualizar el usuario'
          );

        }

      });

      return;
    }

    this.api.post(
      'usuarios',
      usuario
    ).subscribe({

      next: (respuesta: any) => {

        this.notificacion.exito(respuesta.mensaje);

        this.mostrarFormulario = false;

        // Se genera una contraseña temporal que el administrador debe entregar al usuario
        if (respuesta.contrasenaTemporal) {
          this.nombreUsuarioTemporal = this.nombreUsuario;
          this.contrasenaTemporal = respuesta.contrasenaTemporal;
          this.modalTemporal = true;
        }

        this.limpiarFormulario();

        this.obtenerUsuarios();

      },

      error: (error: any) => {

        console.error('Error al guardar usuario:', error);

        this.notificacion.error(
          error.error?.mensaje ||
          'No se pudo registrar el usuario'
        );

      }

    });

  }

  limpiarFormulario(): void {

    this.primerNombre = '';
    this.segundoNombre = '';
    this.primerApellido = '';
    this.segundoApellido = '';
    this.dpi = '';
    this.telefono = '';
    this.correoElectronico = '';

    this.idTipoEmpleado = 0;
    this.idCargo = 0;

    this.nombreUsuario = '';
    this.idRol = 0;
    this.idEstadoUsuario = 0;

    this.editando = false;
    this.idCuentaEditar = 0;

  }

  // Restablece la contraseña de una cuenta: genera una contraseña temporal
  restablecerContrasena(usuario: any): void {

    const nombre = `${usuario.primer_nombre} ${usuario.primer_apellido}`.trim();

    const confirmar = confirm(
      `¿Restablecer la contraseña de ${nombre} (${usuario.nombre_usuario})?\n\n` +
      'Se generará una contraseña temporal que deberá entregarle; ' +
      'al iniciar sesión, el usuario deberá crear una nueva contraseña.'
    );

    if (!confirmar) {
      return;
    }

    this.api.post(`usuarios/${usuario.id_cuenta}/restablecer`, {}).subscribe({

      next: (respuesta: any) => {
        this.nombreUsuarioTemporal = usuario.nombre_usuario;
        this.contrasenaTemporal = respuesta.contrasenaTemporal;
        this.modalTemporal = true;
        this.notificacion.exito(respuesta.mensaje);
      },

      error: (error: any) => {
        console.error('Error al restablecer contraseña:', error);
        this.notificacion.error(
          error.error?.mensaje ||
          'No se pudo restablecer la contraseña'
        );
      }

    });

  }

  cerrarModalTemporal(): void {
    this.modalTemporal = false;
    this.contrasenaTemporal = '';
    this.nombreUsuarioTemporal = '';
  }

  copiarTemporal(): void {
    if (navigator.clipboard && this.contrasenaTemporal) {
      navigator.clipboard.writeText(this.contrasenaTemporal).then(() => {
        this.notificacion.exito('Contraseña copiada al portapapeles');
      }).catch(() => {
        this.notificacion.error('No se pudo copiar la contraseña');
      });
    }
  }

}
