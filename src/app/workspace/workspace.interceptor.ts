import { WorkspaceDataService } from './workspacedata.service';
import {Injectable} from '@angular/core';
import { HttpInterceptor, HttpRequest,
  HttpHandler, HttpEvent, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class WorkspaceInterceptor implements HttpInterceptor {
  constructor(public wds: WorkspaceDataService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let authDataStr = request.headers.get('AuthToken');
    let authData = {};
    if (authDataStr) {
      authData = JSON.parse(authDataStr);
    }

    const ws = this.wds.workspaceId$.getValue();
    if (ws >= 0) {
      authData['ws'] = ws;
    }
    const requestA = request.clone({
      setHeaders: {
        AuthToken: JSON.stringify(authData)
      }
    });

    console.log('WorkspaceInterceptor');
    return next.handle(requestA);
  }
}

export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: WorkspaceInterceptor, multi: true },
];
