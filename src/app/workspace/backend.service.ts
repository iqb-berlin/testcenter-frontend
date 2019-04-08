import { GetFileResponseData, CheckWorkspaceResponseData, BookletsStarted, SysCheckStatistics, ReviewData, LogData, UnitResponse, ResultData, MonitorData } from './workspace.interfaces';
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpUrlEncodingCodec } from '@angular/common/http';
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
      this.serverUrl = this.serverUrl + 'php/';
  }


  // *******************************************************************
  getFiles(): Observable<GetFileResponseData[] | ServerError> {
    return this.http
      .get<GetFileResponseData[]>(this.serverUrlSlim + 'filelist')
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  // *******************************************************************
  deleteFiles(filesToDelete: Array<string>): Observable<string | ServerError> {
    return this.http
      .post<string>(this.serverUrlSlim + 'delete', {f: filesToDelete})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  // *******************************************************************
  checkWorkspace(): Observable<CheckWorkspaceResponseData | ServerError> {
    return this.http
      .post<CheckWorkspaceResponseData>(this.serverUrl + 'checkWorkspace.php', {})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  /*******************************/
  getBookletsStarted(groups: string[]): Observable<BookletsStarted[] | ServerError>{
    return this.http
      .post<BookletsStarted[]>(this.serverUrl + 'getBookletsStarted.php', {g: groups})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  /*******************************/
  lockBooklets(groups: string[]): Observable<boolean | ServerError>{
    return this.http
      .post<boolean>(this.serverUrlSlim + 'lock', {g: groups})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  /*******************************/
  unlockBooklets(groups: string[]): Observable<boolean | ServerError>{
    return this.http
    .post<boolean>(this.serverUrlSlim + 'unlock', {g: groups})
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
  getResultData(): Observable<ResultData[]>{
    return this.http
      .post<ResultData[]>(this.serverUrl + 'getResultData.php', {})
        .pipe(
          catchError(err => [])
        );
  }

  /*******************************/
  getResponses(groups: string[]): Observable<UnitResponse[]>{
    return this.http
      .post<UnitResponse[]>(this.serverUrl + 'getResponses.php', {g: groups})
        .pipe(
          catchError(err => [])
        );
  }

  /*******************************/
  getLogs(groups: string[]): Observable<LogData[]>{
    return this.http
      .post<LogData[]>(this.serverUrl + 'getLogs.php', {g: groups})
        .pipe(
          catchError(err => [])
        );
  }

  /*******************************/
  getReviews(groups: string[]): Observable<ReviewData[]>{
    return this.http
      .post<ReviewData[]>(this.serverUrl + 'getReviews.php', {g: groups})
        .pipe(
          catchError(err => [])
        );
  }

  /*******************************/
  deleteData(groups: string[]): Observable<boolean | ServerError>{
    return this.http
      .post<boolean>(this.serverUrl + 'deleteData.php', {g: groups})
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

