import { IqbComponents } from 'iqb-components';
import { NgModule } from '@angular/core';
import { IqbFilesUploadComponent } from './iqbFilesUpload/iqbFilesUpload.component';
import { IqbFilesUploadQueueComponent } from './iqbFilesUploadQueue/iqbFilesUploadQueue.component';
import { IqbFilesUploadInputForDirective } from './iqbFilesUploadInputFor/iqbFilesUploadInputFor.directive';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
    IqbComponents,
    CommonModule
  ],
  declarations: [
    IqbFilesUploadComponent,
    IqbFilesUploadQueueComponent,
    IqbFilesUploadInputForDirective
  ],
  exports: [
    IqbFilesUploadQueueComponent,
    IqbFilesUploadInputForDirective,
  ]
})
export class IqbFilesModule { }
