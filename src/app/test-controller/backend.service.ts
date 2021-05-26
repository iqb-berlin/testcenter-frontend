import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  UnitData,
  TaggedString,
  TestData,
  TestStateKey,
  StateReportEntry, AppFocusState
} from './test-controller.interfaces';
import { ApiError } from '../app.interfaces';

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
      .put(`${this.serverUrl}test/${testId}/unit/${unitName}/review`, { priority, categories, entry })
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`saveUnitReview Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  saveTestReview(testId: string, priority: number, categories: string, entry: string): Observable<boolean> {
    return this.http
      .put(`${this.serverUrl}test/${testId}/review`, { priority, categories, entry })
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`saveTestReview Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  getTestData(testId: string): Observable<TestData | boolean> {
    return this.http
      .get<TestData>(`${this.serverUrl}test/${testId}`)
      .pipe(
        catchError((err: ApiError) => {
          console.warn(`getTestData Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  getUnitData(testId: string, unitid: string, unitalias: string): Observable<UnitData | boolean> {
    return this.http
      .get<UnitData>(`${this.serverUrl}test/${testId}/unit/${unitid}/alias/${unitalias}`)
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
        `${this.serverUrl}test/${testId}/resource/${resId}`,
        {
          params: new HttpParams().set('v', versionning ? '1' : 'f'),
          responseType: 'text'
        }
      )
      .pipe(
        map(def => <TaggedString>{ tag: internalKey, value: def }),
        catchError((err: ApiError) => {
          console.warn(`getResource Api-Error: ${err.code} ${err.info} `);
          return of(err.code);
        })
      );
  }

  updateTestState(testId: string, newState: StateReportEntry[]): Subscription {
    return this.http
      .patch(`${this.serverUrl}test/${testId}/state`, newState)
      .subscribe({ error: (err: ApiError) => console.error(`updateTestState Api-Error: ${err.code} ${err.info}`) });
  }

  addTestLog(testId: string, logEntries: StateReportEntry[]): Subscription {
    return this.http
      .put(`${this.serverUrl}test/${testId}/log`, logEntries)
      .subscribe({ error: (err: ApiError) => console.error(`addTestLog Api-Error: ${err.code} ${err.info}`) });
  }

  updateUnitState(testId: string, unitName: string, newState: StateReportEntry[]): Subscription {
    return this.http
      .patch(`${this.serverUrl}test/${testId}/unit/${unitName}/state`, newState)
      .subscribe({ error: (err: ApiError) => console.error(`setUnitState Api-Error: ${err.code} ${err.info}`) });
  }

  addUnitLog(testId: string, unitName: string, logEntries: StateReportEntry[]): Subscription {
    return this.http
      .put(`${this.serverUrl}test/${testId}/unit/${unitName}/log`, logEntries)
      .subscribe({ error: (err: ApiError) => console.error(`addUnitLog Api-Error: ${err.code} ${err.info}`) });
  }

  notifyDyingTest(testId: string): void {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.serverUrl + `test/${testId}/connection-lost`);
    } else {
      fetch(this.serverUrl + `test/${testId}/connection-lost`, {
        keepalive: true,
        method: 'POST'
      });
    }
  }

  updateUnitStateData(testId: string, timeStamp: number, unitName: string,
                      dataPartsAllString: string, unitStateDataType: string) : Observable<boolean> {
    // TODO remove after api changed
    const response = dataPartsAllString;
    const restorePoint = dataPartsAllString;
    const responseType = unitStateDataType;
    return this.http
      .put(`${this.serverUrl}test/${testId}/unit/${unitName}/response`, { timeStamp, response, responseType })
      .pipe(
        switchMap(() => this.http
          .patch(`${this.serverUrl}test/${testId}/unit/${unitName}/restorepoint`, { timeStamp, restorePoint })
          .pipe(
            map(() => true),
            catchError((err: ApiError) => {
              console.warn(`newUnitStateData/restorepoint Api-Error: ${err.code} ${err.info} `);
              return of(false);
            })
          )),
        catchError((err: ApiError) => {
          console.warn(`newUnitStateData/response Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  lockTest(testId: string, timeStamp: number, content: string): Observable<boolean> {
    return this.http
      .patch<boolean>(`${this.serverUrl}test/${testId}/lock`, { timeStamp, content })
      .pipe(
        map(() => true),
        catchError((err: ApiError) => {
          console.warn(`lockBooklet Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }
}
