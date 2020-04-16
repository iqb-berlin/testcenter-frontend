import { AboutComponent } from './app-root/about/about.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {AppRootComponent} from "./app-root/app-root.component";
import {LoginComponent} from "./app-root/login/login.component";
import {SysCheckStarterComponent} from "./app-root/sys-check-starter/sys-check-starter.component";
import {AdminStarterComponent} from "./app-root/admin-starter/admin-starter.component";
import {CodeInputComponent} from "./app-root/code-input/code-input.component";
import {RouteDispatcherActivateGuard} from "./app-routing-guards";
import {TestStarterComponent} from "./app-root/test-starter/test-starter.component";
import {RouteDispatcherComponent} from "./app-root/route-dispatcher/route-dispatcher.component";


const routes: Routes = [
  {
    path: '',
    redirectTo: 'r/route-dispatcher',
    pathMatch: 'full'
  },
  {path: 'r', component: AppRootComponent,
    children: [
      {path: '', redirectTo: 'route-dispatcher', pathMatch: 'full'},
      {path: 'login', redirectTo: 'route-dispatcher', pathMatch: 'full'},
      {path: 'login/:returnTo', component: LoginComponent},
      {path: 'about', component: AboutComponent},
      {path: 'check-starter', component: SysCheckStarterComponent},
      {path: 'test-starter', component: TestStarterComponent},
      {path: 'admin-starter', component: AdminStarterComponent},
      {path: 'route-dispatcher', component: RouteDispatcherComponent, canActivate: [RouteDispatcherActivateGuard]},
      {path: 'code-input', component: CodeInputComponent}
    ]
  },
  {path: 'about', component: AboutComponent},
  {path: 'check', loadChildren: () => import('./sys-check/sys-check.module').then(m => m.SysCheckModule)},
  {path: 'admin', loadChildren: () => import('./workspace-admin/workspace.module').then(m => m.WorkspaceModule)},
  {path: 'superadmin', loadChildren: () => import('./superadmin/superadmin.module').then(m => m.SuperadminModule)},
  {path: 'wsmonitor', loadChildren: () => import('./workspace-monitor/workspace-monitor.module').then(m => m.WorkspaceMonitorModule)},
  {path: 't', loadChildren: () => import('./test-controller/test-controller.module').then(m => m.TestControllerModule)},
  {path: '**', component: RouteDispatcherComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [RouteDispatcherActivateGuard]
})
export class AppRoutingModule { }
