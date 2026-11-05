import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaAutenticado()) {
    router.navigate(['/login']);
    return false;
  }

  // Si el usuario tiene contraseña temporal pendiente, no puede pasar de aqui
  if (authService.debeCambiarContrasena() && !state.url.startsWith('/cambiar-contrasena')) {
    router.navigate(['/cambiar-contrasena']);
    return false;
  }

  return true;
};
