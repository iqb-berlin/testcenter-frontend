import { Injectable } from '@angular/core';
import { LogindataService } from './logindata.service';
import { HttpInterceptor, HttpRequest,
  HttpHandler, HttpEvent, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(public lds: LogindataService) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
/*    const personToken = this.lds.personToken$.getValue();
    const bookletDbId = this.lds.bookletDbId$.getValue();
    console.log('/////////////////////////\\\\\\\\\\\\\\\\\\\\\\\\\\\\');

    if (personToken && (bookletDbId > 0)) {
      console.log('/////////////////////////');
      request = request.clone({
        setHeaders: {
          AuthToken: personToken + '##' + bookletDbId.toString()
        }
      });
    } */
    const authData = {
      l: this.lds.loginToken$.getValue(),
      p: this.lds.personToken$.getValue(),
      b: this.lds.bookletDbId$.getValue()
    };
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
