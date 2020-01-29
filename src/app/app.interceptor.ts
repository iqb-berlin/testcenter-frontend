import { MainDataService } from './maindata.service';
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest,
  HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()

export class AuthInterceptor implements HttpInterceptor {
  constructor(public mds: MainDataService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const loginData = this.mds.loginData$.getValue();
    if (loginData !== null) {
      let authDataStr = request.headers.get('AuthToken');
      let authData = {};
      if (authDataStr) {
        authData = JSON.parse(authDataStr);
      }
      authData['at'] = loginData.admintoken;
      return next.handle(request.clone({
        setHeaders: {
          AuthToken: JSON.stringify(authData)
        }
      }));
    } else {
      return next.handle(request);
    }
  }
}
