import { MonitorComponent } from './monitor/monitor.component';
import { ResultsComponent } from './results/results.component';
import { NgModule, Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MyfilesComponent } from './myfiles/myfiles.component';
import { AdminComponent } from './admin.component';

const routes: Routes = [
  {
    path: 'admin',
    component: AdminComponent,
    children: [
      {path: '', redirectTo: 'myfiles', pathMatch: 'full'},
      {path: 'myfiles', component: MyfilesComponent},
      {path: 'monitor', component: MonitorComponent},
      {path: 'results', component: ResultsComponent},
      {path: '**', component: MyfilesComponent}
    ]
  }];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
