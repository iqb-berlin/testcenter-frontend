import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
// import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { catchError } from 'rxjs/operators';

@Injectable()
export class BackendService {

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private http: HttpClient) {
      this.serverUrl = this.serverUrl + 'admin/';
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
      .post<LoginStatusResponseData>(this.serverUrl + 'loginAdmin.php', {n: name, p: password}, httpOptions)
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
      .post<boolean>(this.serverUrl + 'logoutAdmin.php', {at: token}, httpOptions)
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
      .post<LoginStatusResponseData>(this.serverUrl + 'getStatusAdmin.php', {at: token}, httpOptions)
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
      .post<GetFileResponseData[]>(this.serverUrl + 'getFile.php', {
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
      .post<GetFileResponseData[]>(this.serverUrl + 'getFileList.php', {at: token, ws: workspaceId}, httpOptions)
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
      .post<string>(this.serverUrl + 'deleteFiles.php', {at: token, ws: workspaceId, f: filesToDelete}, httpOptions)
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
      .post<CheckWorkspaceResponseData>(this.serverUrl + 'checkWorkspace.php', {at: token, ws: workspaceId}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  // *******************************************************************
  getBookletlist(token: string, wsId: number): Observable<BookletlistResponseData[] | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<BookletlistResponseData[]>(this.serverUrl + 'getBookletList.php', {at: token, ws: wsId}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  getRegisteredTestTakers(token: string, wsId: number): Observable<RegisteredTestTakersResponseData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<RegisteredTestTakersResponseData>(this.serverUrl + 'getTotalUsers.php', {at: token, ws: wsId}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  getTotalBooklets(token: string, wsId: number): Observable<TotalBookletsResponseData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<TotalBookletsResponseData>(this.serverUrl + 'getTotalBooklets.php', {at: token, ws: wsId}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  getTotalUnits(token: string, wsId: number): Observable<TotalUnitsResponseData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<TotalUnitsResponseData>(this.serverUrl + 'getTotalUnits.php', {at: token, ws: wsId}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  getDetailedTestTakers(token: string, wsId: number): Observable<DetailedTestTakersResponseData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<DetailedTestTakersResponseData>(this.serverUrl + 'getDetailedTestTakers.php', {at: token, ws: wsId}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  getDetailedBooklets(token: string, wsId: number): Observable<DetailedBookletsResponseData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<DetailedBookletsResponseData>(this.serverUrl + 'getDetailedBooklets.php', {at: token, ws: wsId}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
  }

  getDetailedUnits(token: string, wsId: number): Observable<DetailedUnitsResponseData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<DetailedUnitsResponseData>(this.serverUrl + 'getDetailedUnits.php', {at: token, ws: wsId}, httpOptions)
        .pipe(
          catchError(this.handleError)
        );
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

export interface BookletlistResponseData {
  name: string;
  laststate: string;
  locked: boolean;
}

export interface RegisteredTestTakersResponseData {
  howManyUsers: number;
}

export interface TotalBookletsResponseData {
  howManyBooklets: number;
}

export interface TotalUnitsResponseData {
  howManyUnits: number;
}

export interface DetailedTestTakersResponseData {
  loginNames: string[];
}

export interface DetailedBookletsResponseData {
  bookletNames: string;
}

export interface DetailedUnitsResponseData {
  unitNames: string;
  unitIds: string;
}