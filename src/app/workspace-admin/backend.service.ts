import { GetFileResponseData, CheckWorkspaceResponseData, SysCheckStatistics,
  ReviewData, LogData, UnitResponse, ResultData } from './workspace.interfaces';
import {Injectable, Inject} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, of} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorHandler, ServerError } from 'iqb-components';
import {WorkspaceDataService} from "./workspacedata.service";
import {WorkspaceData} from "../app.interfaces";

@Injectable({
  providedIn: 'root'
})
export class BackendService {


  constructor(
    @Inject('SERVER_URL') private readonly serverUrl: string,
    private wds: WorkspaceDataService,
    private http: HttpClient
  ) {
  }

  getWorkspaceData(workspaceId: string): Observable<WorkspaceData | number> {
    return this.http
      .get<WorkspaceData>(this.serverUrl + 'workspace/' + workspaceId)
      .pipe(
        catchError(errCode => of(errCode))
      );
  }

  getFiles(): Observable<GetFileResponseData[] | ServerError> {

    return this.http
      .get<GetFileResponseData[]>(this.serverUrl + `workspace/${this.wds.wsId}/files`)
      .pipe(catchError(ErrorHandler.handle));
  }

  deleteFiles(filesToDelete: Array<string>): Observable<FileDeletionReport | ServerError> {

    return this.http
      .request<FileDeletionReport>('delete', this.serverUrl + `workspace/${this.wds.wsId}/files`, {body: {f: filesToDelete}})
      .pipe(catchError(ErrorHandler.handle));
  }

  checkWorkspace(): Observable<CheckWorkspaceResponseData | ServerError> {

    return this.http
      .get<CheckWorkspaceResponseData>(this.serverUrl + `workspace/${this.wds.wsId}/validation`, {})
      .pipe(catchError(ErrorHandler.handle));
  }

  getResultData(): Observable<ResultData[]> {

    return this.http
      .get<ResultData[]>(this.serverUrl + `workspace/${this.wds.wsId}/results`, {})
      .pipe(catchError(() => []));
  }

  getResponses(groups: string[]): Observable<UnitResponse[]> {

    return this.http
      .get<UnitResponse[]>(this.serverUrl + `workspace/${this.wds.wsId}/responses`, {params: {groups: groups.join(',')}})
      .pipe(catchError(() => []));
  }

  getLogs(groups: string[]): Observable<LogData[]> {

    return this.http
      .get<LogData[]>(this.serverUrl + `workspace/${this.wds.wsId}/logs`, {params: {groups: groups.join(',')}})
      .pipe(catchError(() => []));
  }

  getReviews(groups: string[]): Observable<ReviewData[]> {

    return this.http
      .get<ReviewData[]>(this.serverUrl + `workspace/${this.wds.wsId}/reviews`, {params: {groups: groups.join(',')}})
      .pipe(catchError(() => []));
  }

  deleteData(groups: string[]): Observable<boolean | ServerError> {

    return this.http
      .request<boolean>('delete', this.serverUrl + `workspace/${this.wds.wsId}/responses`, {body: {groups: groups}})
      .pipe(catchError(ErrorHandler.handle));
  }

  getSysCheckReportList(): Observable<SysCheckStatistics[] | ServerError> {

    return this.http
      .get<ReviewData[]>(this.serverUrl + `workspace/${this.wds.wsId}/sys-check/reports/overview`)
      .pipe(catchError(() => []));
  }

  getSysCheckReport(reports: string[], enclosure: string, columnDelimiter: string, lineEnding: string)
    : Observable<Blob|ServerError> {

    return this.http
      .get(this.serverUrl + `workspace/${this.wds.wsId}/sys-check/reports`,
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

  deleteSysCheckReports(checkIds: string[]): Observable <FileDeletionReport|ServerError> {

    return this.http
      .request<FileDeletionReport>('delete', this.serverUrl + `workspace/${this.wds.wsId}/sys-check/reports`, {body: {checkIds: checkIds}})
      .pipe(catchError(ErrorHandler.handle));
  }

  downloadFile(fileType: string, fileName: string): Observable<Blob|ServerError> {

    return this.http
      .get(this.serverUrl + `workspace/${this.wds.wsId}/file/${fileType}/${fileName}`, {responseType: 'blob'})
      .pipe(catchError(ErrorHandler.handle));
  }
}

export interface FileDeletionReport {
  deleted: string[];
  not_allowed: string[];
  did_not_exist: string[];
}
