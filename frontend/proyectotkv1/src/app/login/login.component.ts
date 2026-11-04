import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  usuario = '';
  contrasena = '';
  errorLogin = '';
  mensajeExito = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Mensaje de confirmacion al crear la contraseña (se llega con logout({cambio:'exitoso'}))
    if (this.route.snapshot.queryParamMap.get('cambio') === 'exitoso') {
      this.mensajeExito = 'Contrasena creada correctamente. Inicie sesion con su nueva contrasena.';
    }
  }

  irAlKanban() {
    this.router.navigate(['/inicio/kanban']);
  }

  iniciarSesion() {
    this.errorLogin = '';
    this.mensajeExito = '';

    this.authService.login(this.usuario, this.contrasena).subscribe({
      next: (respuesta) => {
        console.log('Login exitoso:', respuesta);
        if (respuesta.debe_cambiar_contrasena) {
          // Contraseña temporal: debe crear una nueva contraseña antes de entrar
          this.router.navigate(['/cambiar-contrasena']);
        } else {
          this.router.navigate(['/inicio/kanban']);
        }
      },
      error: (error) => {
        console.log('Error de login:', error);
        this.errorLogin = error.error?.mensaje || 'Error al iniciar sesion';
      }
    });
  }
}
