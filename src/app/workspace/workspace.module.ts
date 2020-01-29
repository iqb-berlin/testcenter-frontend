import { FlexLayoutModule } from '@angular/flex-layout';
import { BackendService } from './backend.service';
import { IqbFilesModule } from '../iqb-files';
import { ReactiveFormsModule } from '@angular/forms';
import { NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceDataService } from './workspacedata.service';

import { WorkspaceRoutingModule } from './workspace-routing.module';
import { WorkspaceComponent } from './workspace.component';
import { FilesComponent } from './files/files.component';
import { ResultsComponent } from './results/results.component';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MonitorComponent } from './monitor/monitor.component';
import { MatExpansionModule } from '@angular/material/expansion';
import {MatGridListModule} from '@angular/material/grid-list';
import { SyscheckComponent } from './syscheck/syscheck.component';
import {IqbComponentsModule} from 'iqb-components';
import {HTTP_INTERCEPTORS} from "@angular/common/http";
import {WorkspaceInterceptor} from "./workspace.interceptor";

@NgModule({
  imports: [
    IqbFilesModule,
    CommonModule,
    WorkspaceRoutingModule,
    MatTableModule,
    MatTabsModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSortModule,
    MatCardModule,
    MatExpansionModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    MatSnackBarModule,
    MatGridListModule,
    IqbComponentsModule,
    FlexLayoutModule,
    MatCardModule,
    FlexLayoutModule
  ],
  exports: [
    WorkspaceComponent
  ],
  declarations: [
    WorkspaceComponent,
    FilesComponent,
    ResultsComponent,
    MonitorComponent,
    SyscheckComponent
  ],
  providers: [
    // interceptor adds ws to AuthToken
    // not working when module is lazy loaded!
    {
      provide: HTTP_INTERCEPTORS,
      useClass: WorkspaceInterceptor,
      multi: true
    },
    BackendService,
    WorkspaceDataService
  ],
})

export class WorkspaceModule { }
