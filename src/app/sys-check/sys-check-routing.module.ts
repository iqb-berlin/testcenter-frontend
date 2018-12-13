import { RunComponent } from './run.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StartComponent } from './start.component';

const routes: Routes = [
  {
    path: 'check',
    component: StartComponent
  },
  {
    path: 'checkrun/:c',
    component: RunComponent
  }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SysCheckRoutingModule { }
