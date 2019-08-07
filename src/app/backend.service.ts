import { LoginData } from './app.interfaces';
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// ============================================================================
// class instead of interface to be able to use instanceof to check type
export class ServerError {
  public code: number;
  public labelNice: string;
  public labelSystem: string;
  constructor(code: number, labelNice: string, labelSystem: string) {
    this.code = code;
    this.labelNice = labelNice;
    this.labelSystem = labelSystem;
  }
}

// ============================================================================
export class ErrorHandler {
  public static handle(errorObj: HttpErrorResponse): Observable<ServerError> {
    let myreturn: ServerError = null;
    if (errorObj.error instanceof ErrorEvent) {
      myreturn = new ServerError(500, 'Verbindungsproblem', (<ErrorEvent>errorObj.error).message);
    } else {
      myreturn = new ServerError(errorObj.status, 'Verbindungsproblem', errorObj.message);
      if (errorObj.status === 401) {
        myreturn.labelNice = 'Zugriff verweigert - bitte (neu) anmelden!';
      } else if (errorObj.status === 503) {
        myreturn.labelNice = 'Achtung: Server meldet Datenbankproblem.';
      }
    }

    return of(myreturn);
  }
}

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  private serverUrlSlim = '';

  constructor(
      @Inject('SERVER_URL') private serverUrl: string,
      private http: HttpClient) {

    this.serverUrlSlim = this.serverUrl + 'php/';
    this.serverUrl = this.serverUrl + 'php_start/';
  }

  // *******************************************************************
  login(name: string, password: string): Observable<LoginData | ServerError> {

    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http
      .post<LoginData>(this.serverUrlSlim + 'login.php/login', {n: name, p: password}, {headers})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  // *******************************************************************
  logout(): Observable<boolean | ServerError> {
    return this.http
      .post<boolean>(this.serverUrlSlim + 'logout', {})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  // *******************************************************************
  getLoginData(adminToken: string): Observable<LoginData | ServerError> {
    return this.http
      .post<LoginData>(this.serverUrlSlim + 'login.php/login', {at: adminToken})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  // // *******************************************************************
  // getAboutText(): Observable<string | ServerError> {
  //   const httpOptions = {
  //     headers: new HttpHeaders({
  //       'Content-Type':  'application/json'
  //     })
  //   };
  //   return this.http
  //     .post<string>(this.serverUrl + 'getAboutText.php', httpOptions)
  //       .pipe(
  //         catchError(this.handleError)
  //       );
  // }

}
