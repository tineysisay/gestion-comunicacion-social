import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { NgIf } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificacionUsuarioService } from '../services/notificacion-usuario.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, NgIf],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit, OnDestroy {

  sidebarColapsado = false;
  notificacionesNoLeidas = 0;

  private timerSub: Subscription | null = null;
  private routerSub: Subscription | null = null;

  constructor(
    public authService: AuthService,
    private notificacionUsuarioService: NotificacionUsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.actualizarNoLeidas();

    // Revisar notificaciones no leidas cada 30 segundos
    this.timerSub = interval(30000).subscribe(() => this.actualizarNoLeidas());

    // Refrescar el contador al navegar (ej. al salir de la pagina de notificaciones)
    this.routerSub = this.router.events.subscribe((evento) => {
      if (evento instanceof NavigationEnd) {
        this.actualizarNoLeidas();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timerSub) this.timerSub.unsubscribe();
    if (this.routerSub) this.routerSub.unsubscribe();
  }

  actualizarNoLeidas(): void {
    if (!this.authService.estaAutenticado()) return;
    this.notificacionUsuarioService.noLeidas().subscribe({
      next: (respuesta) => this.notificacionesNoLeidas = respuesta.total || 0,
      error: () => {}
    });
  }

  toggleSidebar(): void {
    this.sidebarColapsado = !this.sidebarColapsado;
  }

  cerrarSesion(): void {
    this.authService.logout();
  }
}
