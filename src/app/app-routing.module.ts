import { AboutComponent } from './about/about.component';
import { StartComponent } from './start/start.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [
  {path: '', component: StartComponent, pathMatch: 'full'},
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
