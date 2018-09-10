import { IqbCommonModule } from '../iqb-common';
import { NgModule } from '@angular/core';
import { IqbFilesUploadComponent } from './iqbFilesUpload/iqbFilesUpload.component';
import { IqbFilesUploadQueueComponent } from './iqbFilesUploadQueue/iqbFilesUploadQueue.component';
import { IqbFilesUploadInputForDirective } from './iqbFilesUploadInputFor/iqbFilesUploadInputFor.directive';

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
