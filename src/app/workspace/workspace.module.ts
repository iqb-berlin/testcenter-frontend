import { FlexLayoutModule } from '@angular/flex-layout';
import { BackendService } from './backend.service';
import { IqbFilesModule } from '../iqb-files';
import { IqbCommonModule } from '../iqb-common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceDataService } from './workspacedata.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


import { HttpClientModule } from '@angular/common/http';
import { WorkspaceRoutingModule } from './workspace-routing.module';
import { WorkspaceComponent } from './workspace.component';
import { FilesComponent } from './files/files.component';
import { ResultsComponent } from './results/results.component';


import { MatTableModule, MatTabsModule, MatButtonModule, MatIconModule, MatToolbarModule,
  MatCheckboxModule, MatSortModule, MatDialogModule, MatTooltipModule, MatSnackBarModule,
  MatSelectModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatCardModule } from '@angular/material';
import { MonitorComponent } from './monitor/monitor.component';
import { MatExpansionModule } from '@angular/material/expansion';
import {MatGridListModule} from '@angular/material/grid-list';
import { SyscheckComponent } from './syscheck/syscheck.component';
import { httpInterceptorProviders } from './workspace.interceptor';

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
    HttpClientModule,
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
    IqbCommonModule,
    FlexLayoutModule,
    MatCardModule,
    BrowserAnimationsModule,
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
    BackendService,
    httpInterceptorProviders,
    WorkspaceDataService
  ],
})

export class WorkspaceModule { }
