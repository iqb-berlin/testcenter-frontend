import { LoginDialogComponent } from './login-dialog/login-dialog.component';
import { BackendService } from './backend/backend.service';
import { IqbFilesModule } from './../iqb-files';
import { IqbCommonModule } from './../iqb-common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusService } from './status.service';

import { HttpClientModule } from '@angular/common/http';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { MyfilesComponent } from './myfiles/myfiles.component';
import { ResultsComponent } from './results/results.component';


import { MatTableModule, MatTabsModule, MatButtonModule, MatIconModule, MatToolbarModule,
  MatCheckboxModule, MatSortModule, MatDialogModule, MatTooltipModule, MatSnackBarModule,
  MatSelectModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule } from '@angular/material';
import { MonitorComponent } from './monitor/monitor.component';

@NgModule({
  imports: [
    IqbFilesModule,
    CommonModule,
    AdminRoutingModule,
    MatTableModule,
    MatTabsModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSortModule,
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
    IqbCommonModule
  ],
  exports: [
    AdminComponent
  ],
  declarations: [
    AdminComponent,
    MyfilesComponent,
    LoginDialogComponent,
    ResultsComponent,
    MonitorComponent
  ],
  providers: [
    BackendService,
    StatusService
  ],
  entryComponents: [
    LoginDialogComponent
  ]
})

export class AdminModule { }
