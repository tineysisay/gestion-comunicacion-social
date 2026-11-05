import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  mensaje: string;
  tipo: 'exito' | 'error' | 'info';
  id: number;
}

@Injectable({ providedIn: 'root' })
export class NotificacionService {

  private toast$ = new Subject<Toast>();
  private confirmResolve: ((value: boolean) => void) | null = null;
  private mostrarConfirm$ = new Subject<string>();
  private idCounter = 0;

  get toastObservable() {
    return this.toast$.asObservable();
  }

  get confirmObservable() {
    return this.mostrarConfirm$.asObservable();
  }

  exito(mensaje: string): void {
    this.toast$.next({ mensaje, tipo: 'exito', id: ++this.idCounter });
  }

  error(mensaje: string): void {
    this.toast$.next({ mensaje, tipo: 'error', id: ++this.idCounter });
  }

  info(mensaje: string): void {
    this.toast$.next({ mensaje, tipo: 'info', id: ++this.idCounter });
  }

  confirmar(mensaje: string): Promise<boolean> {
    return new Promise(resolve => {
      this.confirmResolve = resolve;
      this.mostrarConfirm$.next(mensaje);
    });
  }

  resolverConfirm(valor: boolean): void {
    if (this.confirmResolve) {
      this.confirmResolve(valor);
      this.confirmResolve = null;
    }
  }
}
