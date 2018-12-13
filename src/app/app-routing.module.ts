import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TestControllerComponent } from './test-controller';
import { AboutComponent } from './about/about.component';
import { StartComponent } from './start/start.component';
import { SyscheckComponent } from './syscheck/syscheck.component';


const routes: Routes = [
  {path: '', component: StartComponent, pathMatch: 'full'},
  {path: 'start', component: StartComponent},
  {path: 'about', component: AboutComponent},
  {path: 't', component: TestControllerComponent},
  {path: 'syscheck', component: SyscheckComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
