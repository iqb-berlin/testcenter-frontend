import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {UnitData, TaggedString, TestData} from './test-controller.interfaces';
import {ApiError} from '../app.interfaces';


@Injectable({
  providedIn: 'root'
})
export class BackendService {

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private http: HttpClient
  ) { }

  saveUnitReview(testId: string, unitName: string, priority: number, categories: string, entry: string)
    : Observable<boolean> {
    return this.http
      .put(this.serverUrl + `test/${testId}/unit/${unitName}/review`, {priority, categories, entry})
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`saveUnitReview Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  saveBookletReview(testId: string, priority: number, categories: string, entry: string): Observable<boolean> {
    return this.http
      .put(this.serverUrl + `test/${testId}/review`, {priority, categories, entry})
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`saveBookletReview Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  getTestData(testId: string): Observable<TestData | boolean> {
    return this.http
      .get<TestData>(this.serverUrl + 'test/' + testId)
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getTestData Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  getUnitData(testId: string, unitid: string): Observable<UnitData | boolean> {
    return this.http
      .get<UnitData>(this.serverUrl + 'test/' + testId + '/unit/' + unitid)
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getUnitData Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
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
        catchError((err: ApiError) => {
          console.warn(`getResource Api-Error: ${err.code} ${err.info} `);
          return of(err.code);
        })
      );
  }

  addUnitLog(testId: string, timestamp: number, unitName: string, entry: string): Observable<boolean> {
    return this.http
      .put(this.serverUrl + `test/${testId}/unit/${unitName}/log`, {timestamp, entry})
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`addUnitLog Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  addBookletLog(testId: string, timestamp: number, entry: string): Observable<boolean> {
    return this.http
      .put(this.serverUrl + `test/${testId}/log`, {timestamp, entry})
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`addBookletLog Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  setUnitState(testId: string, unitName: string, stateKey: string, state: string): Observable<boolean> {
    return this.http
      .patch(this.serverUrl + `test/${testId}/unit/${unitName}/state`, {key: stateKey, value: state})
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`setUnitState Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  setBookletState(testId: string, stateKey: string, state: string): Observable<boolean> {
    return this.http
      .patch(this.serverUrl + `test/${testId}/state`, {key: stateKey, value: state})
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`setBookletState Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  newUnitResponse(testId: string, timestamp: number, unitName: string, response: string, responseType: string)
    : Observable<boolean> {
    return this.http
      .put(this.serverUrl + `test/${testId}/unit/${unitName}/response`, {timestamp, response, responseType})
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`newUnitResponse Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  newUnitRestorePoint(testId: string, unitName: string, timestamp: number, restorePoint: string): Observable<boolean> {
    return this.http
      .patch(this.serverUrl + `test/${testId}/unit/${unitName}/restorepoint`, {timestamp, restorePoint})
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`newUnitRestorePoint Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  lockBooklet(testId: string): Observable<boolean> {
    return this.http
      .patch<boolean>(this.serverUrl + `test/${testId}/lock`, {})
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`lockBooklet Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }
}
