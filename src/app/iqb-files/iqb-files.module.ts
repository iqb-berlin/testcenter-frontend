import { IqbCommonModule } from './../iqb-common';
import { NgModule } from '@angular/core';
import { IqbFileUploadComponent } from './iqbFileUpload/iqbFileUpload.component';
import { IqbFileUploadQueueComponent } from './iqbFileUploadQueue/iqbFileUploadQueue.component';
import { IqbFileUploadInputForDirective } from './iqbFileUploadInputFor/iqbFileUploadInputFor.directive';

import { MatProgressBarModule, MatCardModule, MatButtonModule } from '@angular/material';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';


@NgModule({
  imports: [
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatCardModule,
    HttpClientModule,
    IqbCommonModule,
    CommonModule
  ],
  declarations: [
    IqbFileUploadComponent,
    IqbFileUploadQueueComponent,
    IqbFileUploadInputForDirective
  ],
  exports: [
    IqbFileUploadQueueComponent,
    IqbFileUploadInputForDirective,
  ]
})
export class IqbFilesModule { }
