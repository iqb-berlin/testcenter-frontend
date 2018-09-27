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

  showStats(adminToken: string, workspaceId: number, responseOnly: boolean): Observable<GroupResponse[]>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<GroupResponse[]>(this._serverUrl + 'getTestStats.php', {at: adminToken, ws: workspaceId, rso: responseOnly}, httpOptions);
  }

  downloadCSVResponses(adminToken: string, workspaceId: number, groups: GroupResponse[]): Observable<string>{
    const customHeaders = new HttpHeaders().set('Content-Type', 'application/json');
    const httpOptions = {headers: customHeaders, responseType: 'text' as 'json'};

    return this.http
      .post<string>(this._serverUrl + 'getCSVResponses.php', {at: adminToken, ws: workspaceId, groups: groups }, httpOptions);
  }

  downloadCSVResponses2(adminToken: string, workspaceId: number, groups: GroupResponse[]): void{
    let url = this._serverUrl;
    url += 'getCSVResponses.php?';
    url += 'at=';
    url += adminToken;
    url += '&ws=';
    url += workspaceId;
    groups.forEach(group => {
      url += '&groups[]=';
      url += group;
    });
    window.open(url);
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
