import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { BookletData, UnitData, TaggedString } from './test-controller.interfaces';
import { ServerError } from 'iqb-components';


@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private serverUrl2 = 'http://localhost/testcenter-iqb-php/'; // TODO (BEFORE-MERGE) REMOVE

  constructor(
    @Inject('SERVER_URL') private serverUrl: string,
    private http: HttpClient
  ) {
  }


  saveUnitReview(testId: number, unitName: string, priority: number, categories: string, entry: string)
    : Observable<boolean | ServerError> {

    return this.http
      .put<boolean>(this.serverUrl2 + `test/${testId}/unit/${unitName}/review`, {priority, categories, entry})
      .pipe(catchError(this.handle));
  }


  saveBookletReview(testId: number, priority: number, categories: string, entry: string): Observable<boolean | ServerError> {

    return this.http
      .put<boolean>(this.serverUrl2 + `test/${testId}/review`, {priority, categories, entry})
      .pipe(catchError(this.handle));
  }


  getBookletData(testId: number): Observable<BookletData | ServerError> {

    return this.http
      .get<BookletData>(this.serverUrl2 + 'test/' + testId)
      .pipe(catchError(this.handle));
  }


  getUnitData(testId: number, unitid: string): Observable<UnitData | ServerError> {

    return this.http
      .get<UnitData>(this.serverUrl2 + 'test/' + testId + '/unit/' + unitid)
      .pipe(catchError(this.handle));
  }


  getResource(testId: number, internalKey: string, resId: string, versionning = false): Observable<TaggedString | ServerError> {

    return this.http
      .get(
        this.serverUrl2 + `test/${testId}/resource/${resId}`,
        {
          params: new HttpParams().set('v', versionning ? '1' : 'f'),
          responseType: 'text'
        })
      .pipe(
        map(def => <TaggedString>{tag: internalKey, value: def}),
        catchError(this.handle)
      );
  }


  addUnitLog(testId: number, timestamp: number, unitName: string, entry: string): Observable<boolean | ServerError> {

    return this.http
      .put<boolean>(this.serverUrl2 + `test/${testId}/unit/${unitName}/log`, {timestamp, entry})
      .pipe(catchError(this.handle));
  }


  addBookletLog(testId: number, timestamp: number, entry: string): Observable<boolean | ServerError> {

    return this.http
      .put<boolean>(this.serverUrl2 + `test/${testId}/log`, {timestamp, entry})
      .pipe(catchError(this.handle));
  }


  setUnitState(testId: number, unitName: string, stateKey: string, state: string): Observable<boolean | ServerError> {

    return this.http
      .patch<boolean>(this.serverUrl2 + `test/${testId}/unit/${unitName}/state`, {key: stateKey, value: state})
      .pipe(catchError(this.handle));
  }


  setBookletState(testId: number, stateKey: string, state: string): Observable<boolean | ServerError> {

    return this.http
      .patch<boolean>(this.serverUrl2 + `test/${testId}/state`, {key: stateKey, value: state})
      .pipe(catchError(this.handle));
  }


  newUnitResponse(testId: number, timestamp: number, unitName: string, response: string, responseType: string)
    : Observable<boolean | ServerError> {

    return this.http
      .put<boolean>(this.serverUrl2 + `test/${testId}/unit/${unitName}/response`, {timestamp, response, responseType})
      .pipe(catchError(this.handle));
  }


  newUnitRestorePoint(testId: number, unitName: string, timestamp: number, restorePoint: string): Observable<boolean | ServerError> {

    return this.http
      .patch<boolean>(this.serverUrl2 + `test/${testId}/unit/${unitName}/restorepoint`, {timestamp, restorePoint})
      .pipe(catchError(this.handle));
  }



  // 7777777777777777777777777777777777777777777777777777777777777777777777
  handle(errorObj: HttpErrorResponse): Observable<ServerError> {
    let myreturn;
    if (errorObj.error instanceof ErrorEvent) {
      myreturn = new ServerError(500, 'Verbindungsproblem', (<ErrorEvent>errorObj.error).message);
    } else {
      myreturn = new ServerError(errorObj.status, 'Verbindungsproblem', errorObj.message);
      if (errorObj.status === 401) {
        myreturn.labelNice = 'Zugriff verweigert - bitte (neu) anmelden!';
      } else if (errorObj.status === 504) {
        myreturn.labelNice = 'Achtung: Server meldet Datenbankproblem.';
      }
    }

    return of(myreturn);
  }
}
