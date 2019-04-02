import { AboutComponent } from './about/about.component';
import { SuperadminComponent } from './superadmin/superadmin.component';
import { StartComponent } from './start/start.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WorkspaceComponent } from './workspace';


const routes: Routes = [
  {path: '', redirectTo: 'start', pathMatch: 'full'},
  {path: 'start', component: StartComponent},
  {path: 'ws', component: WorkspaceComponent},
  {path: 'about', component: AboutComponent},
  {path: 'superadmin', component: SuperadminComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
