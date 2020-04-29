import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GroupMonitorRoutingModule } from './group-monitor-routing.module';
import { GroupMonitorComponent } from './group-monitor.component';


@NgModule({
  declarations: [GroupMonitorComponent],
  imports: [
    CommonModule,
    GroupMonitorRoutingModule
  ]
})
export class GroupMonitorModule { }
