import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

import { IqbComponentsModule } from 'iqb-components';
import { BackendService } from './backend.service';
import { WorkspaceMonitorRoutingModule } from './workspace-monitor-routing.module';
import { WorkspaceMonitorComponent } from './workspace-monitor.component';

@NgModule({
  declarations: [WorkspaceMonitorComponent],
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatSnackBarModule,
    IqbComponentsModule,
    WorkspaceMonitorRoutingModule,
    FlexLayoutModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  providers: [
    BackendService
  ]
})
export class WorkspaceMonitorModule { }
