import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {Observable, of, Subscription} from 'rxjs';
import {catchError, map, switchMap} from 'rxjs/operators';
import {UnitData, TaggedString, TestData, UnitStatus} from './test-controller.interfaces';
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

  addUnitLog(testId: string, timestamp: number, unitName: string, entry: string): Subscription {
    return this.http
      .put(this.serverUrl + `test/${testId}/unit/${unitName}/log`, {timestamp, entry})
      .subscribe({error: (err: ApiError) => console.error(`addUnitLog Api-Error: ${err.code} ${err.info}`)});
  }

  addBookletLog(testId: string, timestamp: number, entry: string): Subscription {
    return this.http
      .put(this.serverUrl + `test/${testId}/log`, {timestamp, entry})
      .subscribe({error: (err: ApiError) => console.error(`addBookletLog Api-Error: ${err.code} ${err.info}`)});
  }

  // TODO collect those and send some together
  setUnitStatus(testId: string, unitName: string, newUnitStatus: UnitStatus): Subscription {
    return this.http
      .patch(this.serverUrl + `test/${testId}/unit/${unitName}/state`, newUnitStatus)
      .subscribe({error: (err: ApiError) => console.error(`setUnitState Api-Error: ${err.code} ${err.info}`)});
  }

  setBookletState(testId: string, stateKey: string, state: string): Subscription {
    return this.http
      .patch(this.serverUrl + `test/${testId}/state`, {key: stateKey, value: state})
      .subscribe({error: (err: ApiError) => console.error(`setBookletState Api-Error: ${err.code} ${err.info}`)});
  }

  newUnitStateData(testId: string, timestamp: number, unitName: string, dataPartsAllString: string, unitStateDataType: string)
    : Observable<boolean> {
    // TODO remove after api changed
    const response = dataPartsAllString;
    const restorePoint = dataPartsAllString;
    const responseType = unitStateDataType;
    return this.http
      .put(this.serverUrl + `test/${testId}/unit/${unitName}/response`, {timestamp, response, responseType})
      .pipe(
        switchMap(() => {
          return this.http
            .patch(this.serverUrl + `test/${testId}/unit/${unitName}/restorepoint`, {timestamp, restorePoint})
            .pipe(
              map(() => true),
              catchError((err: ApiError) => {
                console.warn(`newUnitStateData/restorepoint Api-Error: ${err.code} ${err.info} `);
                return of(false);
              })
            );
        }),
        catchError((err: ApiError) => {
          console.warn(`newUnitStateData/response Api-Error: ${err.code} ${err.info} `);
          return of(false);
        })
      );
  }

  lockTest(testId: string): Observable<boolean> {
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
