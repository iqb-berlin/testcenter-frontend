import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuperadminRoutingModule } from './superadmin-routing.module';
import { SuperadminComponent } from './superadmin.component';


@NgModule({
  declarations: [SuperadminComponent],
  imports: [
    CommonModule,
    SuperadminRoutingModule
  ],
  exports: [
    SuperadminComponent
  ]
})
export class SuperadminModule { }
