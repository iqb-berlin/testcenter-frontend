import { GetFileResponseData, CheckWorkspaceResponseData, BookletsStarted, SysCheckStatistics,
  ReviewData, LogData, UnitResponse, ResultData, MonitorData } from './workspace.interfaces';
import {Injectable, Inject} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorHandler, ServerError } from 'iqb-components';

@Injectable()
export class BackendService {


  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    private http: HttpClient
  ) {
  }


  getFiles(workspaceId: number): Observable<GetFileResponseData[] | ServerError> {

    return this.http
      .get<GetFileResponseData[]>(this.serverUrl + `workspace/${workspaceId}/files`)
      .pipe(catchError(ErrorHandler.handle));
  }

  deleteFiles(workspaceId: number, filesToDelete: Array<string>): Observable<FileDeletionReport | ServerError> {

    return this.http
      .request<FileDeletionReport>('delete', this.serverUrl + `workspace/${workspaceId}/files`, {body: {f: filesToDelete}})
      .pipe(catchError(ErrorHandler.handle));
  }

  checkWorkspace(workspaceId: number): Observable<CheckWorkspaceResponseData | ServerError> {

    return this.http
      .get<CheckWorkspaceResponseData>(this.serverUrl + `workspace/${workspaceId}/validation`, {})
      .pipe(catchError(ErrorHandler.handle));
  }

  getBookletsStarted(workspaceId: number, groups: string[]): Observable<BookletsStarted[] | ServerError> {

    return this.http
      .get<BookletsStarted[]>(this.serverUrl + `workspace/${workspaceId}/booklets/started`, {params: {groups: groups.join(',')}})
      .pipe(catchError(ErrorHandler.handle));
  }

  lockBooklets(workspaceId: number, groups: string[]): Observable<boolean | ServerError> {

    return this.http
      .patch<boolean>(this.serverUrl + `workspace/${workspaceId}/tests/lock`, {groups: groups})
      .pipe(catchError(ErrorHandler.handle));
  }

  unlockBooklets(workspaceId: number, groups: string[]): Observable<boolean | ServerError> {

    return this.http
      .patch<boolean>(this.serverUrl + `workspace/${workspaceId}/tests/unlock`, {groups: groups})
      .pipe(catchError(ErrorHandler.handle));
  }


  getMonitorData(workspaceId: number): Observable<MonitorData[] | ServerError> {

    return this.http
      .get<MonitorData[]>(this.serverUrl + `workspace/${workspaceId}/status`, {})
      .pipe(catchError(ErrorHandler.handle));
  }

  getResultData(workspaceId: number): Observable<ResultData[]> {

    return this.http
      .get<ResultData[]>(this.serverUrl + `workspace/${workspaceId}/results`, {})
      .pipe(catchError(() => []));
  }

  getResponses(workspaceId: number, groups: string[]): Observable<UnitResponse[]> {

    return this.http
      .get<UnitResponse[]>(this.serverUrl + `workspace/${workspaceId}/responses`, {params: {groups: groups.join(',')}})
      .pipe(catchError(() => []));
  }

  getLogs(workspaceId: number, groups: string[]): Observable<LogData[]> {

    return this.http
      .get<LogData[]>(this.serverUrl + `workspace/${workspaceId}/logs`, {params: {groups: groups.join(',')}})
      .pipe(catchError(() => []));
  }

  getReviews(workspaceId: number, groups: string[]): Observable<ReviewData[]> {

    return this.http
      .get<ReviewData[]>(this.serverUrl + `workspace/${workspaceId}/reviews`, {params: {groups: groups.join(',')}})
      .pipe(catchError(() => []));
  }

  deleteData(workspaceId: number, groups: string[]): Observable<boolean | ServerError> {

    return this.http
      .request<boolean>('delete', this.serverUrl + `workspace/${workspaceId}/responses`, {body: {groups: groups}})
      .pipe(catchError(ErrorHandler.handle));
  }

  getSysCheckReportList(workspaceId: number): Observable<SysCheckStatistics[] | ServerError> {

    return this.http
      .get<ReviewData[]>(this.serverUrl + `workspace/${workspaceId}/sys-check/reports/overview`)
      .pipe(catchError(() => []));
  }

  getSysCheckReport(workspaceId: number, reports: string[], enclosure: string, columnDelimiter: string, lineEnding: string)
    : Observable<Blob|ServerError> {

    return this.http
      .get(this.serverUrl + `workspace/${workspaceId}/sys-check/reports`,
        {
          params: {
            checkIds: reports.join(','),
            delimiter: columnDelimiter,
            enclosure: enclosure,
            lineEnding: lineEnding
          },
          headers: {
            'Accept': 'text/csv'
          },
          responseType: 'blob'
        })
      .pipe(catchError(ErrorHandler.handle));
  }

  deleteSysCheckReports(workspaceId: number, checkIds: string[]): Observable <FileDeletionReport|ServerError> {

    return this.http
      .request<FileDeletionReport>('delete', this.serverUrl + `workspace/${workspaceId}/sys-check/reports`, {body: {checkIds: checkIds}})
      .pipe(catchError(ErrorHandler.handle));
  }

  downloadFile(workspaceId: number, fileType: string, fileName: string): Observable<Blob|ServerError> {

    return this.http
      .get(this.serverUrl + `workspace/${workspaceId}/file/${fileType}/${fileName}`, {responseType: 'blob'})
      .pipe(catchError(ErrorHandler.handle));
  }
}

export interface FileDeletionReport {
  deleted: string[];
  not_allowed: string[];
  did_not_exist: string[];
}
