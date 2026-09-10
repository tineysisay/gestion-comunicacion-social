import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {

  constructor(private api: ApiService) {}

  obtenerTiposEmpleado(): Observable<any[]> {
    return this.api.get<any[]>('tipos-empleado');
  }

  crearTipoEmpleado(data: any): Observable<any> {
    return this.api.post<any>('tipos-empleado', data);
  }

  actualizarTipoEmpleado(id: number, data: any): Observable<any> {
    return this.api.put<any>(`tipos-empleado/${id}`, data);
  }

  eliminarTipoEmpleado(id: number): Observable<any> {
    return this.api.delete<any>(`tipos-empleado/${id}`);
  }

  obtenerCargos(): Observable<any[]> {
    return this.api.get<any[]>('cargos');
  }

  crearCargo(data: any): Observable<any> {
    return this.api.post<any>('cargos', data);
  }

  actualizarCargo(id: number, data: any): Observable<any> {
    return this.api.put<any>(`cargos/${id}`, data);
  }

  eliminarCargo(id: number): Observable<any> {
    return this.api.delete<any>(`cargos/${id}`);
  }

  obtenerRoles(): Observable<any[]> {
    return this.api.get<any[]>('roles');
  }

  crearRol(data: any): Observable<any> {
    return this.api.post<any>('roles', data);
  }

  actualizarRol(id: number, data: any): Observable<any> {
    return this.api.put<any>(`roles/${id}`, data);
  }

  eliminarRol(id: number): Observable<any> {
    return this.api.delete<any>(`roles/${id}`);
  }

  obtenerEstadosUsuario(): Observable<any[]> {
    return this.api.get<any[]>('estados-usuario');
  }

  crearEstadoUsuario(data: any): Observable<any> {
    return this.api.post<any>('estados-usuario', data);
  }

  actualizarEstadoUsuario(id: number, data: any): Observable<any> {
    return this.api.put<any>(`estados-usuario/${id}`, data);
  }

  eliminarEstadoUsuario(id: number): Observable<any> {
    return this.api.delete<any>(`estados-usuario/${id}`);
  }

  obtenerTiposRecurso(): Observable<any[]> {
    return this.api.get<any[]>('tipos-recurso');
  }

  crearTipoRecurso(data: any): Observable<any> {
    return this.api.post<any>('tipos-recurso', data);
  }

  actualizarTipoRecurso(id: number, data: any): Observable<any> {
    return this.api.put<any>(`tipos-recurso/${id}`, data);
  }

  eliminarTipoRecurso(id: number): Observable<any> {
    return this.api.delete<any>(`tipos-recurso/${id}`);
  }

  obtenerEstadosActividad(): Observable<any[]> {
    return this.api.get<any[]>('estados-actividad');
  }

  crearEstadoActividad(data: any): Observable<any> {
    return this.api.post<any>('estados-actividad', data);
  }

  actualizarEstadoActividad(id: number, data: any): Observable<any> {
    return this.api.put<any>(`estados-actividad/${id}`, data);
  }

  eliminarEstadoActividad(id: number): Observable<any> {
    return this.api.delete<any>(`estados-actividad/${id}`);
  }

  obtenerPrioridades(): Observable<any[]> {
    return this.api.get<any[]>('prioridades');
  }

  crearPrioridad(data: any): Observable<any> {
    return this.api.post<any>('prioridades', data);
  }

  actualizarPrioridad(id: number, data: any): Observable<any> {
    return this.api.put<any>(`prioridades/${id}`, data);
  }

  eliminarPrioridad(id: number): Observable<any> {
    return this.api.delete<any>(`prioridades/${id}`);
  }

  obtenerInstituciones(): Observable<any[]> {
    return this.api.get<any[]>('instituciones');
  }

  crearInstitucion(data: any): Observable<any> {
    return this.api.post<any>('instituciones', data);
  }

  actualizarInstitucion(id: number, data: any): Observable<any> {
    return this.api.put<any>(`instituciones/${id}`, data);
  }

  eliminarInstitucion(id: number): Observable<any> {
    return this.api.delete<any>(`instituciones/${id}`);
  }
}
