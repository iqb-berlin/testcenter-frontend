import { MainDataService } from './maindata.service';
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest,
  HttpHandler, HttpEvent, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(public mds: MainDataService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let authDataStr = request.headers.get('AuthToken');
    let authData = {};
    if (authDataStr) {
      authData = JSON.parse(authDataStr);
    }

    const loginData = this.mds.loginData$.getValue();
    if (loginData !== null) {
      authData['at'] = loginData.admintoken;
    }
    const requestA = request.clone({
      setHeaders: {
        AuthToken: JSON.stringify(authData)
      }
    });

    return next.handle(requestA);
  }
}

export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
];
