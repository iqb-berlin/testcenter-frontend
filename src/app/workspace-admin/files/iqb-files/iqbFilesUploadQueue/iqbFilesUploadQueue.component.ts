import {
  Component, EventEmitter, OnDestroy, QueryList, ViewChildren, Input, Output
} from '@angular/core';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { IqbFilesUploadComponent, UploadStatus } from '../iqbFilesUpload/iqbFilesUpload.component';

@Component({
  selector: 'iqb-files-upload-queue',
  templateUrl: 'iqbFilesUploadQueue.component.html',
  exportAs: 'iqbFilesUploadQueue',
  styleUrls: ['../iqb-files.scss']
})
export class IqbFilesUploadQueueComponent implements OnDestroy {
  @ViewChildren(IqbFilesUploadComponent) fileUploads: QueryList<IqbFilesUploadComponent>;

  public files: Array<any> = [];

  public disableClearButton = true;

  /* Http request input bindings */
  @Input()
  httpUrl: string;

  @Input()
  httpRequestHeaders: HttpHeaders | {
    [header: string]: string | string[];
  } = new HttpHeaders().set('Content-Type', 'multipart/form-data');

  @Input()
  httpRequestParams: HttpParams | {
    [param: string]: string | string[];
  } = new HttpParams();

  @Input()
  fileAlias: string;

  @Input()
  folderName: string;

  @Input()
  folder: string;

  @Output() uploadCompleteEvent = new EventEmitter<IqbFilesUploadQueueComponent>();

  add(file: any): void {
    this.files.push(file);
  }

  public removeAll(): void {
    this.files.splice(0, this.files.length);
  }

  ngOnDestroy(): void {
    if (this.files) {
      this.removeAll();
    }
  }

  removeFile(fileToRemove: IqbFilesUploadComponent): void {
    this.files.splice(fileToRemove.id, 1);
  }

  analyseStatus(): void {
    let someoneiscomplete = false;
    let someoneisbusy = false;
    let someoneisready = false;
    this.fileUploads.forEach(fileUpload => {
      if ((fileUpload.status === UploadStatus.ok) || (fileUpload.status === UploadStatus.error)) {
        someoneiscomplete = true;
      } else if (fileUpload.status === UploadStatus.busy) {
        someoneisbusy = true;
      } else if (fileUpload.status === UploadStatus.ready) {
        someoneisready = true;
      }
    });

    if (someoneiscomplete && !someoneisbusy) {
      this.uploadCompleteEvent.emit();
      this.disableClearButton = false;
    }
  }
}
