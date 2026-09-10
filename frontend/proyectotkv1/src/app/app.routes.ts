import { Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { InicioComponent } from './inicio/inicio.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { SolicitantesComponent } from './solicitantes/solicitantes.component';
import { RecursosComponent } from './recursos/recursos.component';
import { SolicitudesComponent } from './solicitudes/solicitudes.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'inicio',
    component: InicioComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'usuarios',
        component: UsuariosComponent
      },
      {
        path: 'solicitantes',
        component: SolicitantesComponent
      },
      {
        path: 'recursos',
        component: RecursosComponent
      },
      {
        path: 'solicitudes',
        component: SolicitudesComponent
      },
      {
        path: 'configuracion',
        component: ConfiguracionComponent
      }
    ]
  }
];
