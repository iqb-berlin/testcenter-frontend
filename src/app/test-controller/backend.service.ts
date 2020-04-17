import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {UnitData, TaggedString, TestData} from './test-controller.interfaces';


@Injectable({
  providedIn: 'root'
})
export class BackendService {

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private http: HttpClient
  ) {
  }


  saveUnitReview(testId: string, unitName: string, priority: number, categories: string, entry: string)
    : Observable<boolean> {
    // TODO endpoint does not give any return, only status 200
    return this.http
      .put<boolean>(this.serverUrl + `test/${testId}/unit/${unitName}/review`, {priority, categories, entry})
      .pipe(catchError(() => of(false)));
  }


  saveBookletReview(testId: string, priority: number, categories: string, entry: string): Observable<boolean> {
    // TODO endpoint does not give any return, only status 200
    return this.http
      .put<boolean>(this.serverUrl + `test/${testId}/review`, {priority, categories, entry})
      .pipe(catchError(() => of(false)));
  }


  getTestData(testId: string): Observable<TestData | number> {
    return this.http
      .get<TestData>(this.serverUrl + 'test/' + testId)
      .pipe(
        catchError(errCode => of(errCode))
      );
  }


  getUnitData(testId: string, unitid: string): Observable<UnitData | number> {
    return this.http
      .get<UnitData>(this.serverUrl + 'test/' + testId + '/unit/' + unitid)
      .pipe(
        catchError(errCode => of(errCode))
      );
  }


  getResource(testId: string, internalKey: string, resId: string, versionning = false): Observable<TaggedString | number> {
    return this.http
      .get(
        this.serverUrl + `test/${testId}/resource/${resId}`,
        {
          params: new HttpParams().set('v', versionning ? '1' : 'f'),
          responseType: 'text'
        })
      .pipe(
        map(def => <TaggedString>{tag: internalKey, value: def}),
        catchError(errCode => of(errCode))
      );
  }


  addUnitLog(testId: string, timestamp: number, unitName: string, entry: string): Observable<boolean> {
    // TODO endpoint does not give any return, only status 200
    return this.http
      .put<boolean>(this.serverUrl + `test/${testId}/unit/${unitName}/log`, {timestamp, entry})
      .pipe(catchError(() => of(false)));
  }


  addBookletLog(testId: string, timestamp: number, entry: string): Observable<boolean> {
    // TODO endpoint does not give any return, only status 200
    return this.http
      .put<boolean>(this.serverUrl + `test/${testId}/log`, {timestamp, entry})
      .pipe(catchError(() => of(false)));
  }


  setUnitState(testId: string, unitName: string, stateKey: string, state: string): Observable<boolean> {
    // TODO endpoint does not give any return, only status 200
    return this.http
      .patch<boolean>(this.serverUrl + `test/${testId}/unit/${unitName}/state`, {key: stateKey, value: state})
      .pipe(catchError(() => of(false)));
  }


  setBookletState(testId: string, stateKey: string, state: string): Observable<boolean> {
    // TODO endpoint does not give any return, only status 200
    return this.http
      .patch<boolean>(this.serverUrl + `test/${testId}/state`, {key: stateKey, value: state})
      .pipe(catchError(() => of(false)));
  }


  newUnitResponse(testId: string, timestamp: number, unitName: string, response: string, responseType: string)
    : Observable<boolean> {
    // TODO endpoint does not give any return, only status 200
    return this.http
      .put<boolean>(this.serverUrl + `test/${testId}/unit/${unitName}/response`, {timestamp, response, responseType})
      .pipe(catchError(() => of(false)));
  }


  newUnitRestorePoint(testId: string, unitName: string, timestamp: number, restorePoint: string): Observable<boolean> {
    // TODO endpoint does not give any return, only status 200
    return this.http
      .patch<boolean>(this.serverUrl + `test/${testId}/unit/${unitName}/restorepoint`, {timestamp, restorePoint})
      .pipe(catchError(() => of(false)));
  }
}
