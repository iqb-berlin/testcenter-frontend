import { FlexLayoutModule } from '@angular/flex-layout';
import { LoginDialogComponent } from './login-dialog/login-dialog.component';
import { BackendService } from './backend.service';
import { IqbFilesModule } from '../iqb-files';
import { IqbCommonModule } from '../iqb-common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainDatastoreService } from './maindatastore.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


import { HttpClientModule } from '@angular/common/http';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { MyfilesComponent } from './myfiles/myfiles.component';
import { ResultsComponent } from './results/results.component';


import { MatTableModule, MatTabsModule, MatButtonModule, MatIconModule, MatToolbarModule,
  MatCheckboxModule, MatSortModule, MatDialogModule, MatTooltipModule, MatSnackBarModule,
  MatSelectModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatCardModule } from '@angular/material';
import { MonitorComponent } from './monitor/monitor.component';
import { MatExpansionModule } from '@angular/material/expansion';
import {MatGridListModule} from '@angular/material/grid-list';

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
    BrowserAnimationsModule,
    FlexLayoutModule
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
    MainDatastoreService
  ],
  entryComponents: [
    LoginDialogComponent
  ]
})

export class AdminModule { }
