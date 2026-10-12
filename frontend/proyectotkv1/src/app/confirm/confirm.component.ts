import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificacionService } from '../services/notificacion.service';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="confirm-overlay" *ngIf="mostrar" (click)="cancelar()">
      <div class="confirm-card" (click)="$event.stopPropagation()">
        <div class="confirm-icono">
          <span class="icono-advertencia">&#9888;</span>
        </div>
        <p class="confirm-mensaje">{{ mensaje }}</p>
        <div class="confirm-botones">
          <button class="btn-cancelar" (click)="cancelar()">Cancelar</button>
          <button class="btn-aceptar" (click)="aceptar()">Aceptar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirm-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(27, 58, 107, 0.5);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      animation: fadeInOverlay 0.15s ease;
    }
    .confirm-card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 16px 48px rgba(27, 58, 107, 0.2);
      animation: scaleInModal 0.2s ease;
    }
    .confirm-icono { margin-bottom: 15px; }
    .icono-advertencia {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #FEF3C7;
      color: #F59E0B;
      font-size: 26px;
    }
    .confirm-mensaje {
      font-size: 15px;
      color: #475569;
      margin-bottom: 25px;
      line-height: 1.5;
    }
    .confirm-botones {
      display: flex;
      justify-content: center;
      gap: 12px;
    }
    .btn-cancelar {
      padding: 10px 24px;
      background: #F8FAFC;
      color: #475569;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.12s ease;
    }
    .btn-cancelar:hover { background: #F1F5F9; }
    .btn-aceptar {
      padding: 10px 24px;
      background: #1B3A6B;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: background-color 0.12s ease, box-shadow 0.12s ease;
    }
    .btn-aceptar:hover { background: #243F7A; box-shadow: 0 2px 8px rgba(27, 58, 107, 0.35); }
  `]
})
export class ConfirmComponent implements OnInit, OnDestroy {

  mostrar = false;
  mensaje = '';
  private sub!: Subscription;

  constructor(
    private notificacion: NotificacionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sub = this.notificacion.confirmObservable.subscribe(mensaje => {
      this.mensaje = mensaje;
      this.mostrar = true;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  aceptar(): void {
    this.mostrar = false;
    this.notificacion.resolverConfirm(true);
    this.cdr.detectChanges();
  }

  cancelar(): void {
    this.mostrar = false;
    this.notificacion.resolverConfirm(false);
    this.cdr.detectChanges();
  }
}
