import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface NotificacionUsuario {
  id_notificacion: number;
  id_solicitud: number | null;
  mensaje: string;
  fecha_notificacion: string;
  leida: boolean | number;
  nombre_tipo_notificacion: string;
  nombre_actividad: string | null;
}

@Injectable({ providedIn: 'root' })
export class NotificacionUsuarioService {

  constructor(private api: ApiService) {}

  obtener(): Observable<NotificacionUsuario[]> {
    return this.api.get<NotificacionUsuario[]>('notificaciones');
  }

  noLeidas(): Observable<{ total: number }> {
    return this.api.get<{ total: number }>('notificaciones/no-leidas');
  }

  marcarLeida(id: number): Observable<any> {
    return this.api.put<any>(`notificaciones/${id}/leer`, {});
  }

  marcarTodas(): Observable<any> {
    return this.api.put<any>('notificaciones/leer-todas', {});
  }

  eliminar(id: number): Observable<any> {
    return this.api.delete<any>(`notificaciones/${id}`);
  }
}
