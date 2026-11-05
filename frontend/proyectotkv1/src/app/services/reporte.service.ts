import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {

  constructor(private api: ApiService) {}

  obtenerEstadisticas(): Observable<any> {
    return this.api.get<any>('dashboard/estadisticas');
  }

  solicitudesPorEstadoDetalle(idEstado: number): Observable<any[]> {
    return this.api.get<any[]>(`reportes/solicitudes-detalle-por-estado?idEstado=${idEstado}`);
  }

  solicitudesPorFecha(fechaInicio: string, fechaFin: string): Observable<any[]> {
    return this.api.get<any[]>(`reportes/solicitudes-por-fecha?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
  }

  cargaPorUsuario(anio?: number, mes?: number): Observable<any[]> {
    let url = 'reportes/carga-por-usuario';
    if (anio && mes) {
      url += `?anio=${anio}&mes=${mes}`;
    }
    return this.api.get<any[]>(url);
  }

  actividadesPorUsuario(): Observable<any[]> {
    return this.api.get<any[]>('reportes/actividades-por-usuario');
  }
}
