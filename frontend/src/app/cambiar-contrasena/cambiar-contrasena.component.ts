import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-cambiar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cambiar-contrasena.component.html',
  styleUrl: './cambiar-contrasena.component.css'
})
export class CambiarContrasenaComponent {

  contrasenaActual = '';
  contrasenaNueva = '';
  confirmarContrasena = '';
  error = '';
  enviando = false;

  constructor(private authService: AuthService) {}

  // Primer acceso: el usuario entro con la contraseña temporal,
  // no se le vuelve a pedir, solo crea la nueva.
  get esPrimerAcceso(): boolean {
    return this.authService.debeCambiarContrasena();
  }

  get tiene8(): boolean {
    return this.contrasenaNueva.length >= 8;
  }

  get tieneMayuscula(): boolean {
    return /[A-Z]/.test(this.contrasenaNueva);
  }

  get tieneNumero(): boolean {
    return /[0-9]/.test(this.contrasenaNueva);
  }

  get coinciden(): boolean {
    return this.contrasenaNueva.length > 0 && this.contrasenaNueva === this.confirmarContrasena;
  }

  get formularioValido(): boolean {
    return (
      (this.esPrimerAcceso || this.contrasenaActual.length > 0) &&
      this.tiene8 &&
      this.tieneMayuscula &&
      this.tieneNumero &&
      this.coinciden
    );
  }

  guardar(): void {
    this.error = '';

    if (!this.formularioValido) {
      this.error = 'Complete todos los campos y verifique las reglas de la contraseña';
      return;
    }

    this.enviando = true;

    this.authService.cambiarContrasena(this.contrasenaActual, this.contrasenaNueva).subscribe({
      next: () => {
        // Contraseña creada: se cierra la sesión para que el usuario
        // ingrese nuevamente con su nueva contraseña
        this.authService.logout({ cambio: 'exitoso' });
      },
      error: (err) => {
        this.enviando = false;
        this.error = err.error?.mensaje || 'Error al cambiar la contraseña';
      }
    });
  }

  cerrarSesion(): void {
    this.authService.logout();
  }
}
