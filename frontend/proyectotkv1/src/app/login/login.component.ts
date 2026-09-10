import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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

  constructor(private authService: AuthService, private router: Router) {}

  iniciarSesion() {
    this.errorLogin = '';

    this.authService.login(this.usuario, this.contrasena).subscribe({
      next: (respuesta) => {
        console.log('Login exitoso:', respuesta);
        this.router.navigate(['/inicio']);
      },
      error: (error) => {
        console.log('Error de login:', error);
        this.errorLogin = error.error?.mensaje || 'Error al iniciar sesion';
      }
    });
  }
}
