import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:3000/api';
  private tokenKey = 'auth_token';
  private usuarioKey = 'auth_usuario';

  constructor(private http: HttpClient, private router: Router) {}

  login(usuario: string, contrasena: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { usuario, contrasena }).pipe(
      tap((respuesta: any) => {
        localStorage.setItem(this.tokenKey, respuesta.token);
        const datos = {
          ...respuesta.usuario,
          debe_cambiar_contrasena: respuesta.debe_cambiar_contrasena
        };
        localStorage.setItem(this.usuarioKey, JSON.stringify(datos));
      })
    );
  }

  logout(queryParams?: any): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usuarioKey);
    this.router.navigate(['/login'], queryParams ? { queryParams } : undefined);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUsuario(): any {
    const usuario = localStorage.getItem(this.usuarioKey);
    return usuario ? JSON.parse(usuario) : null;
  }

  esAdmin(): boolean {
    const usuario = this.getUsuario();
    // Admin (1) y Desarrollador (7) tienen los mismos permisos de gestion
    return usuario && (usuario.id_rol === 1 || usuario.id_rol === 7);
  }

  esDesarrollador(): boolean {
    const usuario = this.getUsuario();
    return usuario && usuario.id_rol === 7;
  }

  esLector(): boolean {
    const usuario = this.getUsuario();
    return usuario && usuario.id_rol === 2;
  }

  esJefe(): boolean {
    const usuario = this.getUsuario();
    return usuario && usuario.id_rol === 3;
  }

  // Indica que el usuario debe crear una nueva contraseña (primer inicio con contraseña temporal)
  debeCambiarContrasena(): boolean {
    const usuario = this.getUsuario();
    return !!(usuario && usuario.debe_cambiar_contrasena);
  }

  cambiarContrasena(contrasenaActual: string, contrasenaNueva: string): Observable<any> {
    const token = this.getToken();
    return this.http.put(`${this.apiUrl}/usuarios/cambiar-contrasena`, { contrasenaActual, contrasenaNueva }, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  estaAutenticado(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiracion = payload.exp * 1000;
      return Date.now() < expiracion;
    } catch {
      return false;
    }
  }

  // id_usuario extraido del payload del JWT
  getIdUsuario(): number {
    const token = this.getToken();
    if (!token) return 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id_usuario || 0;
    } catch {
      return 0;
    }
  }

  obtenerPerfil(): Observable<any> {
    const token = this.getToken();
    return this.http.get(`${this.apiUrl}/usuarios/perfil`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  actualizarPerfil(datos: any): Observable<any> {
    const token = this.getToken();
    return this.http.put(`${this.apiUrl}/usuarios/perfil`, datos, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}
