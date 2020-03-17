import { AboutComponent } from './about/about.component';
import { StartComponent } from './start/start.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


const routes: Routes = [
  {path: '', component: StartComponent, pathMatch: 'full'},
  {path: 'start', component: StartComponent},
  {path: 'about', component: AboutComponent},
  {path: 'check', loadChildren: './sys-check/sys-check.module#SysCheckModule'},
  {path: 'admin', loadChildren: './workspace-admin/workspace.module#WorkspaceModule'},
  {path: 'superadmin', loadChildren: './superadmin/superadmin.module#SuperadminModule'},
  {path: 'wsmonitor', loadChildren: './workspace-monitor/workspace-monitor.module#WorkspaceMonitorModule'},
  {path: 't', loadChildren: './test-controller/test-controller.module#TestControllerModule'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
