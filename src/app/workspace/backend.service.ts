import { GetFileResponseData, CheckWorkspaceResponseData, BookletsStarted, SysCheckStatistics, ReviewData, LogData, UnitResponse, ResultData, MonitorData } from './workspace.interfaces';
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
// import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { catchError } from 'rxjs/operators';
import { ErrorHandler, ServerError } from '../backend.service';

@Injectable()
export class BackendService {
  private serverUrlSlim = '';

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private http: HttpClient) {
      this.serverUrlSlim = this.serverUrl + 'php/ws.php/'
      this.serverUrl = this.serverUrl + 'php_admin/';
  }


  // *******************************************************************
  // Fehlerbehandlung beim Aufrufer
  getFile(filetype: string, filename: string): Observable<GetFileResponseData[] | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<GetFileResponseData[]>(this.serverUrl + 'getFile.php', {
            ft: filetype,
            fn: filename
          }, httpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  // *******************************************************************
  // Fehlerbehandlung beim Aufrufer
  getFiles(): Observable<GetFileResponseData[] | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<GetFileResponseData[]>(this.serverUrl + 'getFileList.php', {}, httpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  // *******************************************************************
  // Fehlerbehandlung beim Aufrufer
  deleteFiles(filesToDelete: Array<string>): Observable<string | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<string>(this.serverUrl + 'deleteFiles.php', {f: filesToDelete}, httpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  // *******************************************************************
  checkWorkspace(): Observable<CheckWorkspaceResponseData | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<CheckWorkspaceResponseData>(this.serverUrl + 'checkWorkspace.php', {}, httpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  /*******************************/
  getBookletsStarted(groups: string[]): Observable<BookletsStarted[] | ServerError>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<BookletsStarted[]>(this.serverUrl + 'getBookletsStarted.php', {g: groups}, httpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  /*******************************/
  lockBooklets(groups: string[]): Observable<boolean | ServerError>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<boolean>(this.serverUrl + 'lockBooklets.php', {g: groups}, httpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  /*******************************/
  unlockBooklets(groups: string[]): Observable<boolean | ServerError>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<boolean>(this.serverUrl + 'unlockBooklets.php', {g: groups}, httpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
}

  /*******************************/
  getMonitorData(): Observable<MonitorData[] | ServerError>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<MonitorData[]>(this.serverUrl + 'getMonitorData.php', {}, httpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
}

  /*******************************/
  getResultData(): Observable<ResultData[] | ServerError>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<ResultData[]>(this.serverUrl + 'getResultData.php', {}, httpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  /*******************************/
  getResponses(groups: string[]): Observable<UnitResponse[] | ServerError>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<UnitResponse[]>(this.serverUrl + 'getResponses.php', {g: groups}, httpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
}

  /*******************************/
  getLogs(groups: string[]): Observable<LogData[] | ServerError>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<LogData[]>(this.serverUrl + 'getLogs.php', {g: groups}, httpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  /*******************************/
  getReviews(groups: string[]): Observable<ReviewData[] | ServerError>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<ReviewData[]>(this.serverUrl + 'getReviews.php', {g: groups}, httpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  /*******************************/
  deleteData(groups: string[]): Observable<boolean | ServerError>{
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<boolean>(this.serverUrl + 'deleteData.php', {g: groups}, httpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  /*******************************/
  getSysCheckReportList(): Observable<SysCheckStatistics[] | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<SysCheckStatistics[]>(this.serverUrl + 'getSysCheckReportList.php', {}, httpOptions)
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  /*******************************/
  getSysCheckReport(reports: string[], columnDelimiter: string, quoteChar: string): Observable<string[] | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<string[]>(this.serverUrl + 'getSysCheckReport.php',
        {r: reports, cd: columnDelimiter, q: quoteChar}, httpOptions)
          .pipe(
            catchError(ErrorHandler.handle)
          );
  }

  /*******************************/
  deleteSysCheckReports(reports: string[]): Observable<boolean | ServerError> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };
    return this.http
      .post<boolean>(this.serverUrl + 'deleteSysCheckReports.php',
        {r: reports}, httpOptions)
          .pipe(
            catchError(ErrorHandler.handle)
          );
  }
}


// #############################################################################################

