import { MainDataService } from './maindata.service';
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest,
  HttpHandler, HttpEvent, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(public mds: MainDataService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const loginData = this.mds.loginData$.getValue();
    let authData = {};
    if (loginData === null) {
      authData = {
        l: '',
        p: '',
        b: 0
      };
    } else {
      authData = {
        l: loginData.logintoken,
        p: loginData.persontoken,
        b: loginData.booklet
      };
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
