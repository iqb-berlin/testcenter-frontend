import { MainDataService } from './maindata.service';
import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest,
  HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, tap} from "rxjs/operators";
import {Router, RouterState, RouterStateSnapshot} from "@angular/router";
import {AuthAccessKeyType, AuthFlagType} from "./app.interfaces";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private mds: MainDataService,
    private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.mds.isApiVersionValid) {
      this.mds.appError$.next({
        label: "Server-Problem: API-Version ungültig",
        description: "Keine weiteren Server-Aufrufe erlaubt",
        category: "FATAL"
      });
      return throwError(500);
    }

    // if (request.headers.get('AuthToken') !== null) {
    //   return next.handle(request);
    // }
    let tokenStr = '';
    const authData = MainDataService.getAuthDataFromLocalStorage();
    if (authData) {
      if (authData.token) {
        if (authData.access[AuthAccessKeyType.WORKSPACE_ADMIN] || authData.access[AuthAccessKeyType.SUPER_ADMIN]) {
          tokenStr = authData.token;
        } else if (authData.flags.indexOf(AuthFlagType.CODE_REQUIRED) >= 0) {
          tokenStr = 'l:' + authData.token;
        } else if (authData.access[AuthAccessKeyType.TEST]) {
          tokenStr = 'p:' + authData.token;
        }
      }
    }

    const requestA = request.clone({
      setHeaders: {
        AuthToken: tokenStr
      }
    });

    this.mds.incrementDelayedProcessesCount();
    return next.handle(requestA).pipe(
      tap(requ => {
          // filter out OPTIONS request
          if (requ.type > 0) { // TODO is there another way to detect OPTION?
            this.mds.decrementDelayedProcessesCount();
          }
      }),
      catchError(e => {
        this.mds.decrementDelayedProcessesCount();
        let errorCode = 999;
        if (e instanceof HttpErrorResponse) {
          const httpError = e as HttpErrorResponse;
          errorCode = httpError.status;
          if (httpError.error instanceof ErrorEvent) {
            this.mds.appError$.next({
              label: 'Fehler in der Netzwerkverbindung',
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

        return throwError(errorCode);
      })
    )
  }
}
