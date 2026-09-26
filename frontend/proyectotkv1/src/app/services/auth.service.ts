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
        localStorage.setItem(this.usuarioKey, JSON.stringify(respuesta.usuario));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usuarioKey);
    this.router.navigate(['/login']);
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
    return usuario && usuario.id_rol === 1;
  }

  esLector(): boolean {
    const usuario = this.getUsuario();
    return usuario && usuario.id_rol === 2;
  }

  esJefe(): boolean {
    const usuario = this.getUsuario();
    return usuario && usuario.id_rol === 3;
  }

  puedeEditar(): boolean {
    return this.esAdmin();
  }

  getNombreRol(): string {
    const usuario = this.getUsuario();
    return usuario ? usuario.nombre_rol : '';
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
