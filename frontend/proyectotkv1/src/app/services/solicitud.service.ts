import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class SolicitudService {

  private cambios$ = new BehaviorSubject<void>(undefined);

  constructor(private api: ApiService) {}

  obtenerTodas(): Observable<any[]> {
    return this.api.get<any[]>('solicitudes');
  }

  obtenerPorId(id: number): Observable<any> {
    return this.api.get<any>(`solicitudes/${id}`);
  }

  crear(data: any): Observable<any> {
    return this.api.post<any>('solicitudes', data);
  }

  actualizar(id: number, data: any): Observable<any> {
    return this.api.put<any>(`solicitudes/${id}`, data);
  }

  eliminar(id: number): Observable<any> {
    return this.api.delete<any>(`solicitudes/${id}`);
  }

  // Notificar que hubo un cambio para que kanban y calendario se actualicen
  notificarCambio(): void {
    this.cambios$.next();
  }

  // Observable para que otros componentes se suscriban a cambios
  observarCambios(): Observable<void> {
    return this.cambios$.asObservable();
  }

  // Obtener solicitudes con cache invalidation
  obtenerTodasConNotificacion(): Observable<any[]> {
    return this.api.get<any[]>('solicitudes');
  }

  obtenerAsignacionesUsuario(id: number): Observable<any[]> {
    return this.api.get<any[]>(`solicitudes/${id}/asignaciones-usuario`);
  }

  asignarUsuario(id: number, data: any): Observable<any> {
    return this.api.post<any>(`solicitudes/${id}/asignaciones-usuario`, data);
  }

  eliminarAsignacionUsuario(id: number, idAsignacion: number): Observable<any> {
    return this.api.delete<any>(`solicitudes/${id}/asignaciones-usuario/${idAsignacion}`);
  }

  obtenerAsignacionesRecurso(id: number): Observable<any[]> {
    return this.api.get<any[]>(`solicitudes/${id}/asignaciones-recurso`);
  }

  asignarRecurso(id: number, data: any): Observable<any> {
    return this.api.post<any>(`solicitudes/${id}/asignaciones-recurso`, data);
  }

  eliminarAsignacionRecurso(id: number, idAsignacion: number): Observable<any> {
    return this.api.delete<any>(`solicitudes/${id}/asignaciones-recurso/${idAsignacion}`);
  }

  obtenerHistorial(id: number): Observable<any[]> {
    return this.api.get<any[]>(`solicitudes/${id}/historial`);
  }

  cambiarEstado(id: number, data: any): Observable<any> {
    return this.api.post<any>(`solicitudes/${id}/historial`, data);
  }
}
