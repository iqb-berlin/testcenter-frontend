import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SyscheckRoutingModule } from './syscheck-routing.module';
import { AboutTextComponent } from './about-text/about-text.component';
import { SyscheckComponent } from './syscheck.component';

@NgModule({
  imports: [
    CommonModule,
    SyscheckRoutingModule
  ],
  declarations: [AboutTextComponent, SyscheckComponent]
})
export class SyscheckModule { }
