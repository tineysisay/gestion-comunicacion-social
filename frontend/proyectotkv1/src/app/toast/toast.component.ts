import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificacionService, Toast } from '../services/notificacion.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-container">
      <div *ngFor="let t of toasts; trackBy: trackById"
           class="toast"
           [class.toast-exito]="t.tipo === 'exito'"
           [class.toast-error]="t.tipo === 'error'"
           [class.toast-info]="t.tipo === 'info'">
        <span class="toast-icono">
          <span *ngIf="t.tipo === 'exito'">&#10004;</span>
          <span *ngIf="t.tipo === 'error'">&#10008;</span>
          <span *ngIf="t.tipo === 'info'">&#8505;</span>
        </span>
        <span class="toast-mensaje">{{ t.mensaje }}</span>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: toast-entrar 0.3s ease;
      min-width: 280px;
      max-width: 400px;
      pointer-events: auto;
    }
    .toast-exito { background: #22C55E; }
    .toast-error { background: #DC2626; }
    .toast-info { background: #2A5298; }
    .toast-icono { font-size: 18px; flex-shrink: 0; }
    .toast-mensaje { flex: 1; }
    @keyframes toast-entrar {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {

  toasts: Toast[] = [];
  private sub!: Subscription;

  constructor(
    private notificacion: NotificacionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sub = this.notificacion.toastObservable.subscribe(toast => {
      this.toasts = [...this.toasts, toast];
      this.cdr.detectChanges();

      const duracion = toast.tipo === 'error' ? 4000 : 3000;
      setTimeout(() => {
        this.toasts = this.toasts.filter(x => x.id !== toast.id);
        this.cdr.detectChanges();
      }, duracion);
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  trackById(_index: number, item: Toast): number {
    return item.id;
  }
}
