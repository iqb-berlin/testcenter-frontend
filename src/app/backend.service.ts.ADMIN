import { LoginData } from './app.interfaces';
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorHandler, ServerError } from 'iqb-components';


@Injectable()
export class BackendService {

  constructor(
      @Inject('SERVER_URL') private serverUrl: string,
      private http: HttpClient) {

    this.serverUrl = this.serverUrl + 'php/';
  }

  login(name: string, password: string): Observable<LoginData | ServerError> {
    return this.http
      .post<LoginData>(this.serverUrl + 'login.php/login', {n: name, p: password})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }

  getLoginData(adminToken: string): Observable<LoginData | ServerError> {
    return this.http
      .post<LoginData>(this.serverUrl + 'login.php/login', {at: adminToken})
        .pipe(
          catchError(ErrorHandler.handle)
        );
  }
}
