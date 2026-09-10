import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class RecursoService {

  constructor(private api: ApiService) {}

  obtenerTodos(): Observable<any[]> {
    return this.api.get<any[]>('recursos');
  }

  obtenerPorId(id: number): Observable<any> {
    return this.api.get<any>(`recursos/${id}`);
  }

  crear(data: any): Observable<any> {
    return this.api.post<any>('recursos', data);
  }

  actualizar(id: number, data: any): Observable<any> {
    return this.api.put<any>(`recursos/${id}`, data);
  }

  eliminar(id: number): Observable<any> {
    return this.api.delete<any>(`recursos/${id}`);
  }
}
