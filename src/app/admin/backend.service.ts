import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
// import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { catchError } from 'rxjs/operators';

@Injectable()
export class BackendService {
  public get serverUrl():string {
    return this._serverUrl;
  }

  constructor(
    @Inject('SERVER_URL') private _serverUrl: string,
    private http: HttpClient) {
      this._serverUrl = this._serverUrl + 'admin/php_admin/';
  }

  private errorHandler(error: Error | any): Observable<any> {
    return Observable.throw(error);
  }

  // *******************************************************************
  login(name: string, password: string): Observable<LoginStatusResponseData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<LoginStatusResponseData>(this._serverUrl + 'loginAdmin.php', {n: name, p: password}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  logout(token: string): Observable<boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<boolean>(this._serverUrl + 'logoutAdmin.php', {at: token}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  getStatus(token: string): Observable<LoginStatusResponseData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<LoginStatusResponseData>(this._serverUrl + 'getStatusAdmin.php', {at: token}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }


  // *******************************************************************
  // Fehlerbehandlung beim Aufrufer
  getFile(token: string, workspaceId: number, filetype: string, filename: string): Observable<GetFileResponseData[] | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<GetFileResponseData[]>(this._serverUrl + 'getFile.php', {
            at: token,
            ws: workspaceId,
            ft: filetype,
            fn: filename
          }, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  // Fehlerbehandlung beim Aufrufer
  getFiles(token: string, workspaceId: number): Observable<GetFileResponseData[] | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<GetFileResponseData[]>(this._serverUrl + 'getFileList.php', {at: token, ws: workspaceId}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  // Fehlerbehandlung beim Aufrufer
  deleteFiles(token: string, workspaceId: number, filesToDelete: Array<string>): Observable<string | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<string>(this._serverUrl + 'deleteFiles.php', {at: token, ws: workspaceId, f: filesToDelete}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  checkWorkspace(token: string, workspaceId: number): Observable<CheckWorkspaceResponseData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<CheckWorkspaceResponseData>(this._serverUrl + 'checkWorkspace.php', {at: token, ws: workspaceId}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  /*******************************/
  getBookletsStarted(adminToken: string, workspaceId: number, groups: string[]): Observable<BookletsStarted[]>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<BookletsStarted[]>(this._serverUrl + 'getBookletsStarted.php', {at: adminToken, ws: workspaceId, g: groups}, httpOptions);
  }

  /*******************************/
  lockBooklets(adminToken: string, workspaceId: number, groups: string[]): Observable<boolean>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<boolean>(this._serverUrl + 'lockBooklets.php', {at: adminToken, ws: workspaceId, g: groups}, httpOptions);
  }

  unlockBooklets(adminToken: string, workspaceId: number, groups: string[]): Observable<boolean>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<boolean>(this._serverUrl + 'unlockBooklets.php', {at: adminToken, ws: workspaceId, g: groups}, httpOptions);
  }

  getMonitorData(adminToken: string, workspaceId: number): Observable<MonitorData[]>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<MonitorData[]>(this._serverUrl + 'getMonitorData.php', {at: adminToken, ws: workspaceId}, httpOptions);
  }

  getResultData(adminToken: string, workspaceId: number): Observable<ResultData[]>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<ResultData[]>(this._serverUrl + 'getResultData.php', {at: adminToken, ws: workspaceId}, httpOptions);
  }

  getResponses(adminToken: string, workspaceId: number, groups: string[]): Observable<UnitResponse[]>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<UnitResponse[]>(this._serverUrl + 'getResponses.php', {at: adminToken, ws: workspaceId, g: groups}, httpOptions);
  }

  getLogs(adminToken: string, workspaceId: number, groups: string[]): Observable<LogData[]>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<LogData[]>(this._serverUrl + 'getLogs.php', {at: adminToken, ws: workspaceId, g: groups}, httpOptions);
  }

  getReviews(adminToken: string, workspaceId: number, groups: string[]): Observable<ReviewData[]>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<ReviewData[]>(this._serverUrl + 'getReviews.php', {at: adminToken, ws: workspaceId, g: groups}, httpOptions);
  }

  deleteData(adminToken: string, workspaceId: number, groups: string[]): Observable<boolean>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<boolean>(this._serverUrl + 'deleteData.php', {at: adminToken, ws: workspaceId, g: groups}, httpOptions);
  }

  getSysCheckReportList(adminToken: string, workspaceId: number): Observable<SysCheckStatistics[]> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<SysCheckStatistics[]>(this._serverUrl + 'getSysCheckReportList.php', {at: adminToken, ws: workspaceId}, httpOptions);
  }

  getSysCheckReport(adminToken: string, workspaceId: number, reports: string[], columnDelimiter: string, quoteChar: string): Observable<string[]> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<string[]>(this._serverUrl + 'getSysCheckReport.php',
        {at: adminToken, ws: workspaceId, r: reports, cd: columnDelimiter, q: quoteChar}, httpOptions);
  }

  deleteSysCheckReports(adminToken: string, workspaceId: number, reports: string[]): Observable<boolean> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<boolean>(this._serverUrl + 'deleteSysCheckReports.php',
        {at: adminToken, ws: workspaceId, r: reports}, httpOptions);
  }

  // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
  private handleError(errorObj: HttpErrorResponse): Observable<ServerError> {
    const myreturn: ServerError = {
      label: 'Fehler bei Datenübertragung',
      code: errorObj.status
    };
    if (errorObj.status === 401) {
      myreturn.label = 'Fehler: Zugriff verweigert - bitte (neu) anmelden!';
    } else if (errorObj.status === 503) {
      myreturn.label = 'Fehler: Server meldet Datenbankproblem.';
    } else if (errorObj.error instanceof ErrorEvent) {
      myreturn.label = 'Fehler: ' + (<ErrorEvent>errorObj.error).message;
    } else {
      myreturn.label = 'Fehler: ' + errorObj.message;
    }

    return Observable.throw(myreturn.label);
  }
}


// #############################################################################################

export interface LoginStatusResponseData {
  admintoken: string;
  name: string;
  workspaces: WorkspaceData[];
  is_superadmin: boolean;
}

export interface WorkspaceData {
  id: number;
  name: string;
}

export interface ServerError {
  code: number;
  label: string;
}

export interface GetFileResponseData {
  filename: string;
  filesize: number;
  filesizestr: string;
  filedatetime: string;
  filedatetimestr: string;
  type: string;
  typelabel: string;
  isChecked: boolean;
}

export interface CheckWorkspaceResponseData {
  errors: string[];
  infos: string[];
  warnings: string[];
}


export interface GroupResponse {
  name: string;
  testsTotal: number;
  testsStarted: number;
  responsesGiven: number;
}

export interface BookletsStarted {
  groupname: string;
  loginname: string;
  code: string;
  bookletname: string;
  locked: boolean;
}

export interface UnitResponse {
  groupname: string;
  loginname: string;
  code: string;
  bookletname: string;
  unitname: string;
  responses: string;
  restorepoint:  string;
  responsetype: string;
  responses_ts: number;
  restorepoint_ts: number;
  laststate: string;
}

export interface MonitorData {
  groupname: string;
  loginsPrepared: number;
  personsPrepared: number;
  bookletsPrepared: number;
  bookletsStarted: number;
  bookletsLocked: number;
}

export interface ResultData {
  groupname: string;
  bookletsStarted: number;
  num_units_min: number;
  num_units_max: number;
  num_units_mean: number;
}

export interface LogData {
  groupname: string;
  loginname: string;
  code: string;
  bookletname: string;
  unitname: string;
  timestamp: number;
  logentry: string;
}

export interface ReviewData {
  groupname: string;
  loginname: string;
  code: string;
  bookletname: string;
  unitname: string;
  priority: number;
  categories: string;
  reviewtime: Date;
  entry: string;
}

export interface SysCheckStatistics {
  id: string;
  label: string;
  count: number;
  details: string[];
}
