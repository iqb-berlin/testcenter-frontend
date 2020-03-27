import { AboutComponent } from './app-root/about/about.component';
import { StartComponent } from './start/start.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {AppRootComponent} from "./app-root/app-root.component";
import {LoginComponent} from "./app-root/login/login.component";
import {SysCheckStarterComponent} from "./app-root/sys-check-starter/sys-check-starter.component";


const routes: Routes = [
  {path: '', redirectTo: 'r', pathMatch: 'full'},
  {path: 'r', component: AppRootComponent,
    children: [
      {path: '', redirectTo: 'login', pathMatch: 'full'},
      {path: 'login/:returnTo', component: LoginComponent},
      {path: 'about', component: AboutComponent},
      {path: 'check-starter', component: SysCheckStarterComponent},
      {path: '**', component: LoginComponent}
    ]
  },
  {path: 'start', component: StartComponent},
  {path: 'about', component: AboutComponent},
  {path: 'check', loadChildren: () => import('./sys-check/sys-check.module').then(m => m.SysCheckModule)},
  {path: 'admin', loadChildren: () => import('./workspace-admin/workspace.module').then(m => m.WorkspaceModule)},
  {path: 'superadmin', loadChildren: () => import('./superadmin/superadmin.module').then(m => m.SuperadminModule)},
  {path: 'wsmonitor', loadChildren: () => import('./workspace-monitor/workspace-monitor.module').then(m => m.WorkspaceMonitorModule)},
  {path: 't', loadChildren: () => import('./test-controller/test-controller.module').then(m => m.TestControllerModule)}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
