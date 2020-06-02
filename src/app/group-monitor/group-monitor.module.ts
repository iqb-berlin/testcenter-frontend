import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GroupMonitorRoutingModule } from './group-monitor-routing.module';
import { GroupMonitorComponent } from './group-monitor.component';

import {MatTableModule} from '@angular/material/table';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatChipsModule } from "@angular/material/chips";
import { CdkTableModule } from '@angular/cdk/table';

import {BackendService} from './backend.service';
import {BookletService} from './booklet.service';
import { TestViewComponent } from './test-view/test-view.component';
import {MatIconModule} from '@angular/material/icon';
import {MatBadgeModule} from '@angular/material/badge';
import {FlexModule} from '@angular/flex-layout';




@NgModule({
  declarations: [
      GroupMonitorComponent,
      TestViewComponent
  ],
    imports: [
        CommonModule,
        GroupMonitorRoutingModule,
        MatTableModule,
        MatTooltipModule,
        CdkTableModule,
        MatChipsModule,
        MatIconModule,
        MatBadgeModule,
        FlexModule
    ],
  providers: [
      BackendService,
      BookletService
  ],
})
export class GroupMonitorModule {
}
