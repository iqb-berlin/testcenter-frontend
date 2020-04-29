import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {WorkspaceMonitorComponent} from "./workspace-monitor.component";


const routes: Routes = [ {
  path: '',
  component: WorkspaceMonitorComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkspaceMonitorRoutingModule { }
