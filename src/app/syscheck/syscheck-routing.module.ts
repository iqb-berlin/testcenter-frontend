import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AboutTextComponent } from './about-text/about-text.component';

const routes: Routes = [
  {
    path: 'aboutText', component: AboutTextComponent 
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SyscheckRoutingModule { }
