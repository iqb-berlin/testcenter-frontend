import {
  Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output
} from '@angular/core';
import {
  HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpHeaders, HttpParams
} from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ApiError } from '../../../../app.interfaces';

interface UploadResponse {
  [filename: string]: {
    warning?: string[];
    error?: string[];
    info?: string[];
  }
}

export enum UploadStatus {
  ready,
  busy,
  ok,
  error
}

@Component({
  selector: 'iqb-files-upload',
  templateUrl: './iqbFilesUpload.component.html',
  exportAs: 'iqbFilesUpload',
  styleUrls: ['../iqb-files.scss']
})
export class IqbFilesUploadComponent implements OnInit, OnDestroy {
  @HostBinding('class') myclass = 'iqb-files-upload';

  constructor(
    private myHttpClient: HttpClient
  ) { }

  private _status: UploadStatus;
  get status(): UploadStatus {
    return this._status;
  }

  set status(newstatus: UploadStatus) {
    this._status = newstatus;
    this.statusChangedEvent.emit(this);
  }

  private requestResponse: UploadResponse;
  get uploadResponse(): UploadResponse {
    switch (this._status) {
      case UploadStatus.busy:
        return { '': { info: ['Bitte warten'] } };
      case UploadStatus.ready:
        return { '': { info: ['Bereit'] } };
      default:
        return this.requestResponse;
    }
  }

  /* Http request input bindings */
  @Input()
  httpUrl = 'http://localhost:8080'; // TODO use normal backend-connection instead

  @Input()
  httpRequestHeaders: HttpHeaders | {
    [header: string]: string | string[];
  } = new HttpHeaders().set('Content-Type', 'multipart/form-data');

  @Input()
  httpRequestParams: HttpParams | {
    [param: string]: string | string[];
  } = new HttpParams();

  @Input()
  fileAlias = 'file';

  @Input()
  folderName = '';

  @Input()
  folder = '';

  @Input()
  get file(): any {
    return this._file;
  }

  set file(file: any) {
    this._file = file;
    this._filedate = this._file.lastModified;
    this.total = this._file.size;
  }

  @Input()
  set id(id: number) {
    this._id = id;
  }

  get id(): number {
    return this._id;
  }

  @Output() removeFileRequestEvent = new EventEmitter<IqbFilesUploadComponent>();
  @Output() statusChangedEvent = new EventEmitter<IqbFilesUploadComponent>();

  public progressPercentage = 0;
  public loaded = 0;
  private total = 0;
  private _file: any;
  private _filedate = '';
  private _id: number;
  private fileUploadSubscription: Subscription;

  ngOnInit(): void {
    this._status = UploadStatus.ready;
    this.requestResponse = {};
    this.upload();
  }

  upload(): void {
    if (this.status !== UploadStatus.ready) {
      return;
    }

    this.status = UploadStatus.busy;
    const formData = new FormData();
    formData.set(this.fileAlias, this._file, this._file.name);
    if ((typeof this.folderName !== 'undefined') && (typeof this.folder !== 'undefined')) {
      if (this.folderName.length > 0) {
        formData.append(this.folderName, this.folder);
      }
    }

    this.fileUploadSubscription = this.myHttpClient.post(this.httpUrl, formData, {
      // headers: this.httpRequestHeaders, TODO why is this commented, and would it not be better?
      observe: 'events',
      params: this.httpRequestParams,
      reportProgress: true,
      responseType: 'json'
    }).subscribe((event: HttpEvent<any>) => {
      if (event.type === HttpEventType.UploadProgress) {
        this.progressPercentage = Math.floor(event.loaded * 100 / event.total);
        this.loaded = event.loaded;
        this.total = event.total;
        this.status = UploadStatus.busy;
      } else if (event.type === HttpEventType.Response) {
        this.requestResponse = event.body;
        this.status = UploadStatus.ok;
      }
    }, err => {
      if (this.fileUploadSubscription) {
        this.fileUploadSubscription.unsubscribe();
      }
      this.status = UploadStatus.error;
      let errorText = 'Hochladen nicht erfolgreich.';
      if (err instanceof HttpErrorResponse) {
        errorText = (err as HttpErrorResponse).message;
      } else if (err instanceof ApiError) {
        const slashPos = err.info.indexOf(' // ');
        errorText = (slashPos > 0) ? err.info.substr(slashPos + 4) : err.info;
      }
      this.requestResponse = { '': { error: [errorText] } };
    });
  }

  public remove(): void {
    if (this.fileUploadSubscription) {
      this.fileUploadSubscription.unsubscribe();
    }
    this.removeFileRequestEvent.emit(this);
  }

  ngOnDestroy(): void {
    if (this.fileUploadSubscription) {
      this.fileUploadSubscription.unsubscribe();
    }
  }
}
