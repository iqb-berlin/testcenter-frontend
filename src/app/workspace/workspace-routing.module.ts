import { SyscheckComponent } from './syscheck/syscheck.component';
import { MonitorComponent } from './monitor/monitor.component';
import { ResultsComponent } from './results/results.component';
import { NgModule, Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FilesComponent } from './files/files.component';
import { WorkspaceComponent } from './workspace.component';

const routes: Routes = [
  {
    path: 'ws/:ws',
    component: WorkspaceComponent,
    children: [
      {path: '', redirectTo: 'files', pathMatch: 'full'},
      {path: 'files', component: FilesComponent},
      {path: 'syscheck', component: SyscheckComponent},
      {path: 'monitor', component: MonitorComponent},
      {path: 'results', component: ResultsComponent},
      {path: '**', component: FilesComponent}
    ]
  }];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkspaceRoutingModule { }
