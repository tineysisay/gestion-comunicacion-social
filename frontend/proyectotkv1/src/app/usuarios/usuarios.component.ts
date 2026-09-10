import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

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
  contrasena = '';
  idRol = 0;
  idEstadoUsuario = 0;

  constructor(private api: ApiService) {}

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
        this.contrasena = usuario.contrasena;
        this.idRol = usuario.id_rol;
        this.idEstadoUsuario = usuario.id_estado_usuario;

      },

      error: (error: any) => {

        console.error('Error al obtener usuario:', error);

        alert(
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
      contrasena: this.contrasena,
      idRol: this.idRol,
      idEstadoUsuario: this.idEstadoUsuario
    };

    if (this.editando) {

      this.api.put(
        `usuarios/${this.idCuentaEditar}`,
        usuario
      ).subscribe({

        next: (respuesta: any) => {

          alert(respuesta.mensaje);

          this.mostrarFormulario = false;

          this.limpiarFormulario();

          this.obtenerUsuarios();

        },

        error: (error: any) => {

          console.error('Error al actualizar usuario:', error);

          alert(
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

        alert(respuesta.mensaje);

        this.mostrarFormulario = false;

        this.limpiarFormulario();

        this.obtenerUsuarios();

      },

      error: (error: any) => {

        console.error('Error al guardar usuario:', error);

        alert(
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
    this.contrasena = '';
    this.idRol = 0;
    this.idEstadoUsuario = 0;

    this.editando = false;
    this.idCuentaEditar = 0;

  }

}
