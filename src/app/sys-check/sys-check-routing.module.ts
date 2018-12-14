import { RunComponent } from './run.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StartComponent } from './start.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'start'
  },
  {
    path: 'start',
    component: StartComponent
  },
  {
    path: 'run/:c',
    component: RunComponent
  }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SysCheckRoutingModule { }
