import { AboutComponent } from './about/about.component';
import { StartComponent } from './start/start.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {WorkspaceComponent} from "./workspace";


const routes: Routes = [
  {path: '', redirectTo: 'start', pathMatch: 'full'},
  {path: 'start', component: StartComponent},
  {path: 'about', component: AboutComponent},
  // {path: 'ws', loadChildren: './workspace/workspace.module#WorkspaceModule'},
  {path: 'ws', component: WorkspaceComponent},
  {path: 'superadmin', loadChildren: './superadmin/superadmin.module#SuperadminModule'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {onSameUrlNavigation: 'reload'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
