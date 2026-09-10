import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class SolicitanteService {

  constructor(private api: ApiService) {}

  obtenerTodos(): Observable<any[]> {
    return this.api.get<any[]>('solicitantes');
  }

  obtenerPorId(id: number): Observable<any> {
    return this.api.get<any>(`solicitantes/${id}`);
  }

  crear(data: any): Observable<any> {
    return this.api.post<any>('solicitantes', data);
  }

  actualizar(id: number, data: any): Observable<any> {
    return this.api.put<any>(`solicitantes/${id}`, data);
  }

  eliminar(id: number): Observable<any> {
    return this.api.delete<any>(`solicitantes/${id}`);
  }
}
