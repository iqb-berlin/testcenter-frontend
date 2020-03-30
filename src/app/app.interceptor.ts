import { MainDataService } from './maindata.service';
import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest,
  HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, tap} from "rxjs/operators";
import {Router, RouterState, RouterStateSnapshot} from "@angular/router";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private mds: MainDataService,
    private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    if (request.headers.get('AuthToken') !== null) {
      return next.handle(request);
    }

    const authData = {
      l: this.mds.loginToken,
      p: this.mds.personToken,
      at: this.mds.adminToken
    };
    const requestA = request.clone({
      setHeaders: {
        AuthToken: JSON.stringify(authData)
      }
    });

    this.mds.incrementDelayedProcessesCount();
    return next.handle(requestA).pipe(
      tap(requ => {
          // filter out OPTIONS request
          if (requ.type > 0) {
            this.mds.decrementDelayedProcessesCount();
          }
      }),
      catchError(e => {
        this.mds.decrementDelayedProcessesCount();
        console.log('err dec');
        if (e instanceof HttpErrorResponse) {
          const httpError = e as HttpErrorResponse;
          if (httpError.error instanceof ErrorEvent) {
            this.mds.appError$.next({
              label: 'Fehler in der Netzwerk-Verbindung',
              description: httpError.message,
              category: "PROBLEM"
            })
          } else {
            let goToLoginPage = false;
            let label = 'Unbekanntes Verbindungsproblem';
            switch (httpError.status) {
              case 401: {
                goToLoginPage = true;
                label = 'Bitte für diese Aktion erst anmelden!';
                break;
              }
              case 403: {
                label = 'Für diese Funktion haben Sie keine Berechtigung.';
                break;
              }
              case 404: {
                label = 'Daten/Objekt nicht gefunden.';
                break;
              }
              case 410: {
                goToLoginPage = true;
                label = 'Anmeldung abgelaufen. Bitte erneut anmelden!';
                break;
              }
              case 500: {
                label = 'Allgemeines Server-Problem.';
                break;
              }
            }
            this.mds.appError$.next({
              label: label,
              description: httpError.message,
              category: "PROBLEM"
            });
            if (goToLoginPage) {
              const state: RouterState = this.router.routerState;
              const snapshot: RouterStateSnapshot = state.snapshot;
              this.router.navigate(['/r/login', snapshot.url]);
            }
          }
        }

        return of(e);
      })
    )
  }
}
