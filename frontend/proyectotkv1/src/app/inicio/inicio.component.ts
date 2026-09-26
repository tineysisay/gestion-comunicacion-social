import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, NgIf],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent {

  sidebarColapsado = false;

  constructor(public authService: AuthService) {}

  toggleSidebar(): void {
    this.sidebarColapsado = !this.sidebarColapsado;
  }

  cerrarSesion(): void {
    this.authService.logout();
  }
}
