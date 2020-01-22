import { ResizeIFrameChildDirective } from './unit-check/resize-IFrameChild/resize-IFrameChild.directive';
import { SyscheckDataService } from './syscheck-data.service';
import { BackendService } from './backend.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SysCheckRoutingModule } from './sys-check-routing.module';
import { StartComponent } from './start.component';
import { RunComponent } from './run.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule, MatCheckboxModule, MatCardModule, MatStepperModule,
  MatIconModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
  MatProgressSpinnerModule, MatSnackBarModule, MatRadioModule } from '@angular/material';
import {MatDividerModule} from '@angular/material/divider';
import {MatListModule} from '@angular/material/list';
import { ReactiveFormsModule } from '@angular/forms';

// import { UAParser } from 'ua-parser-js';

import { EnvironmentCheckComponent } from './environment-check/environment-check.component';
import { NetworkCheckComponent } from './network-check/network-check.component';
import { UnitCheckComponent } from './unit-check/unit-check.component';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { ReportComponent } from './report/report.component';
import { SaveReportComponent } from './report/save-report/save-report.component';
import { TcNaviButtonsComponent } from './unit-check/tc-navi-buttons/tc-navi-buttons.component';

import { TcSpeedChartComponent } from './network-check/tc-speed-chart.component';

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    FlexLayoutModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    SysCheckRoutingModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
    MatSnackBarModule,
    MatDialogModule,
    ReactiveFormsModule,
    // UAParser
  ],
  declarations: [
    StartComponent,
    RunComponent,
    EnvironmentCheckComponent,
    NetworkCheckComponent,
    UnitCheckComponent,
    QuestionnaireComponent,
    ResizeIFrameChildDirective,
    ReportComponent,
    SaveReportComponent,
    TcNaviButtonsComponent,
    TcSpeedChartComponent
  ],
  exports: [
    StartComponent
  ],
  entryComponents: [
    SaveReportComponent
  ],
  providers: [
    BackendService,
    SyscheckDataService
  ]
})
export class SysCheckModule { }
