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
      background: rgba(43, 45, 66, 0.5);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    }
    .confirm-card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 16px 48px rgba(43, 45, 66, 0.2);
    }
    .confirm-icono { margin-bottom: 15px; }
    .icono-advertencia {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #fff3cd;
      color: #FFB703;
      font-size: 26px;
    }
    .confirm-mensaje {
      font-size: 15px;
      color: #333;
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
      background: #ecf0f1;
      color: #555;
      border: 1px solid #bdc3c7;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }
    .btn-cancelar:hover { background: #d5dbdb; }
    .btn-aceptar {
      padding: 10px 24px;
      background: #D90429;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }
    .btn-aceptar:hover { background: #b80323; }
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
