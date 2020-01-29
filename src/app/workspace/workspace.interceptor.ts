import { WorkspaceDataService } from './workspacedata.service';
import {Injectable} from '@angular/core';
import { HttpInterceptor, HttpRequest,
  HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()

export class WorkspaceInterceptor implements HttpInterceptor {
  constructor(public wds: WorkspaceDataService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const ws = this.wds.workspaceId$.getValue();
    if (ws >= 0) {
      let authDataStr = request.headers.get('AuthToken');
      let authData = {};
      if (authDataStr) {
        authData = JSON.parse(authDataStr);
      }
      authData['ws'] = ws;
      return next.handle(request.clone({
        setHeaders: {
          AuthToken: JSON.stringify(authData)
        }
      }))
    } else {
      return next.handle(request);
    }
  }
}
