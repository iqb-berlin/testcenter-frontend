import { MainDataService } from './maindata.service';
import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest,
  HttpHandler, HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, tap} from "rxjs/operators";
import {Router, RouterState, RouterStateSnapshot} from "@angular/router";
import {ApiError} from "./app.interfaces";

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
      return throwError(new ApiError(500, "API-Version ungültig"));
    }

    // if (request.headers.get('AuthToken') !== null) {
    //   return next.handle(request);
    // }
    let tokenStr = '';
    const authData = MainDataService.getAuthDataFromLocalStorage();
    if (authData) {
      if (authData.token) {
        tokenStr = authData.token;
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
        let apiError = new ApiError(999);
        if (e instanceof HttpErrorResponse) {
          const httpError = e as HttpErrorResponse;
          apiError.code = httpError.status;
          apiError.info = httpError.message;
          if (httpError.error instanceof ErrorEvent) {
            this.mds.appError$.next({
              label: 'Fehler in der Netzwerkverbindung',
              description: httpError.message,
              category: "PROBLEM"
            })
          } else {
            let ignoreError = false;
            let goToLoginPage = false;
            let label = 'Unbekanntes Verbindungsproblem';
            switch (httpError.status) {
              case 400: {
                ignoreError = true;
                // TODO get detailed error message from body
                break;
              }
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
            if (!ignoreError) {
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
        }

        return throwError(apiError);
      })
    )
  }
}
