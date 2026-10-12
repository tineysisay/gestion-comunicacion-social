import { Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { InicioComponent } from './inicio/inicio.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { SolicitantesComponent } from './solicitantes/solicitantes.component';
import { SolicitudesComponent } from './solicitudes/solicitudes.component';
import { CalendarioComponent } from './calendario/calendario.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { KanbanComponent } from './kanban/kanban.component';
import { ReportesComponent } from './reportes/reportes.component';
import { NotificacionesComponent } from './notificaciones/notificaciones.component';
import { RecursosComponent } from './recursos/recursos.component';
import { authGuard } from './guards/auth.guard';
import { soloAdminGuard, accesoTotalGuard } from './guards/roles.guard';

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
        path: '',
        redirectTo: 'kanban',
        pathMatch: 'full'
      },
      {
        path: 'kanban',
        component: KanbanComponent,
        canActivate: [accesoTotalGuard]
      },
      {
        path: 'usuarios',
        component: UsuariosComponent,
        canActivate: [soloAdminGuard]
      },
      {
        path: 'solicitantes',
        component: SolicitantesComponent,
        canActivate: [soloAdminGuard]
      },
      {
        path: 'solicitudes',
        component: SolicitudesComponent,
        canActivate: [accesoTotalGuard]
      },
      {
        path: 'calendario',
        component: CalendarioComponent,
        canActivate: [accesoTotalGuard]
      },
      {
        path: 'notificaciones',
        component: NotificacionesComponent,
        canActivate: [accesoTotalGuard]
      },
      {
        path: 'recursos',
        component: RecursosComponent,
        canActivate: [accesoTotalGuard]
      },
      {
        path: 'configuracion',
        component: ConfiguracionComponent,
        canActivate: [accesoTotalGuard]
      },
      {
        path: 'reportes',
        component: ReportesComponent,
        canActivate: [soloAdminGuard]
      }
    ]
  }
];
