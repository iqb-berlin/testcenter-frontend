import { GetFileResponseData, CheckWorkspaceResponseData, SysCheckStatistics,
  ReviewData, LogData, UnitResponse, ResultData } from './workspace.interfaces';
import {Injectable, Inject} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {WorkspaceDataService} from "./workspacedata.service";
import { ErrorHandler, ServerError } from 'iqb-components';

@Injectable()

export class BackendService {
  private serverUrlSlim = '';
  private serverUrlSysCheck = '';

  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    private http: HttpClient,
    private wds: WorkspaceDataService) {

    this.serverUrlSlim = this.serverUrl + 'php/ws.php/';
    this.serverUrlSysCheck = this.serverUrl + 'php_admin/';
    this.serverUrl = this.serverUrl + 'php/';
  }


  getFiles(): Observable<GetFileResponseData[] | ServerError> {
    return this.http
      .get<GetFileResponseData[]>(this.serverUrlSlim + 'filelist')
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  deleteFiles(filesToDelete: Array<string>): Observable<string | ServerError> {
    return this.http
      .post<string>(this.serverUrlSlim + 'delete', {f: filesToDelete})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  checkWorkspace(): Observable<CheckWorkspaceResponseData | ServerError> {
    return this.http
      .post<CheckWorkspaceResponseData>(this.serverUrl + 'checkWorkspace.php', {})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  getResultData(): Observable<ResultData[]> {
    return this.http
      .post<ResultData[]>(this.serverUrl + 'getResultData.php', {})
        .pipe(
          catchError(() => [])
        );
  }

  getResponses(groups: string[]): Observable<UnitResponse[]> {
    return this.http
      .post<UnitResponse[]>(this.serverUrl + 'getResponses.php', {g: groups})
        .pipe(
          catchError(() => [])
        );
  }

  getLogs(groups: string[]): Observable<LogData[]> {
    return this.http
      .post<LogData[]>(this.serverUrl + 'getLogs.php', {g: groups})
        .pipe(
          catchError(() => [])
        );
  }

  getReviews(groups: string[]): Observable<ReviewData[]> {
    return this.http
      .post<ReviewData[]>(this.serverUrl + 'getReviews.php', {g: groups})
        .pipe(
          catchError(() => [])
        );
  }

  deleteData(groups: string[]): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverUrl + 'deleteData.php', {g: groups})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  getSysCheckReportList(): Observable<SysCheckStatistics[] | ServerError> {
    return this.http
      .post<SysCheckStatistics[]>(this.serverUrlSysCheck + 'getSysCheckReportList.php', {ws: this.wds.workspaceId$.getValue()})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  getSysCheckReport(reports: string[], columnDelimiter: string,
                    quoteChar: string): Observable<string[] | ServerError> {
    return this.http
      .post<string[]>(this.serverUrlSysCheck + 'getSysCheckReport.php',
        {r: reports, cd: columnDelimiter, q: quoteChar, ws: this.wds.workspaceId$.getValue()})
          .pipe(
            catchError(ErrorHandler.handle)
          );
  }

  deleteSysCheckReports(reports: string[]): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverUrlSysCheck + 'deleteSysCheckReports.php',
        {r: reports, ws: this.wds.workspaceId$.getValue()})
          .pipe(
            catchError(ErrorHandler.handle)
          );
  }
}
