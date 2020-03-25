import { MainDataService } from './maindata.service';
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest,
  HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(public mds: MainDataService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    if (request.headers.get('AuthToken') !== null) {
      return  next.handle(request);
    }

    const loginData = this.mds.loginData$.getValue();

    let authData;
    if (loginData === null) {
      authData = {
        l: '',
        p: '',
        at: ''
      };
    } else {
      authData = {
        l: loginData.loginToken,
        p: loginData.personToken,
        at: loginData.adminToken
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
