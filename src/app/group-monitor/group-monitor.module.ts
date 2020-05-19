import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GroupMonitorRoutingModule } from './group-monitor-routing.module';
import { GroupMonitorComponent } from './group-monitor.component';

import {MatTableModule} from '@angular/material/table';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatChipsModule } from "@angular/material/chips";
import { CdkTableModule } from '@angular/cdk/table';

import {BackendService} from './backend.service';




@NgModule({
  declarations: [
      GroupMonitorComponent
  ],
  imports: [
      CommonModule,
      GroupMonitorRoutingModule,
      MatTableModule,
      MatTooltipModule,
      CdkTableModule,
      MatChipsModule
  ],
  providers: [
      BackendService
  ],
})
export class GroupMonitorModule {
}
