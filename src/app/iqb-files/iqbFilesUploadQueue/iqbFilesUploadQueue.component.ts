import { Component, EventEmitter, OnInit, OnDestroy, QueryList, ViewChildren, Input, Output } from '@angular/core';
import { IqbFilesUploadComponent, UploadStatus } from '../iqbFilesUpload/iqbFilesUpload.component';
import { HttpHeaders, HttpParams } from '@angular/common/http';


/**
 * A material design file upload queue component.
 */
@Component({
    selector: 'iqb-files-upload-queue',
    templateUrl: `iqbFilesUploadQueue.component.html`,
    exportAs: 'iqbFilesUploadQueue',
  })
  export class IqbFilesUploadQueueComponent implements OnDestroy {

    @ViewChildren(IqbFilesUploadComponent) fileUploads: QueryList<IqbFilesUploadComponent>;

    private files: Array<any> = [];
    private numberOfErrors = 0;
    private numberOfUploads = 0;
    private disableClearButton = true;

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
    tokenName: string;

    @Input()
    token: string;

    @Input()
    folderName: string;

    @Input()
    folder: string;

    @Output() uploadCompleteEvent = new EventEmitter<IqbFilesUploadQueueComponent>();

    // +++++++++++++++++++++++++++++++++++++++++++++++++
    add(file: any) {
      this.files.push(file);
    }

    // +++++++++++++++++++++++++++++++++++++++++++++++++
    public removeAll() {
      this.files.splice(0, this.files.length);
    }

    // +++++++++++++++++++++++++++++++++++++++++++++++++
    ngOnDestroy() {
      if (this.files) {
        this.removeAll();
      }
    }

    // +++++++++++++++++++++++++++++++++++++++++++++++++
    removeFile(fileToRemove: IqbFilesUploadComponent) {
      this.files.splice(fileToRemove.id, 1);
    }

/*    // +++++++++++++++++++++++++++++++++++++++++++++++++
    updateStatus() {
      this.numberOfErrors = 0;
      this.numberOfUploads = 0;

      this.fileUploads.forEach((fileUpload) => {

        fileUpload.upload();
      });
    } */

    // +++++++++++++++++++++++++++++++++++++++++++++++++
    analyseStatus() {
      let someoneiscomplete = false;
      let someoneisbusy = false;
      let someoneisready = false;
      this.fileUploads.forEach((fileUpload) => {
        if ((fileUpload.status === UploadStatus.ok) || (fileUpload.status === UploadStatus.error)) {
          someoneiscomplete = true;
        } else if (fileUpload.status === UploadStatus.busy) {
          someoneisbusy = true;
          return; // forEach
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
