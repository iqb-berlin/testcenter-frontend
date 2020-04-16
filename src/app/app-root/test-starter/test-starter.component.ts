import { Component, OnInit } from '@angular/core';
import {AuthAccessKeyType, AuthData, BookletData} from "../../app.interfaces";
import {from, Subscription} from "rxjs";
import {concatMap} from "rxjs/operators";
import {Router} from "@angular/router";
import {BackendService} from "../../backend.service";
import {MainDataService} from "../../maindata.service";

@Component({
  templateUrl: './test-starter.component.html',
  styleUrls: ['./test-starter.component.css']
})
export class TestStarterComponent implements OnInit {
  booklets: BookletData[] = [];
  private getBookletDataSubscription: Subscription = null;
  public bookletSelectTitle = 'Bitte wählen';

  constructor(
    private router: Router,
    private bs: BackendService,
    private mds: MainDataService
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.bs.getSessionData().subscribe(authDataUntyped => {
        if (typeof authDataUntyped !== 'number') {
          const authData = authDataUntyped as AuthData;
          if (authData) {
            if (authData.token) {
              if (authData.access[AuthAccessKeyType.TEST]) {
                this.booklets = [];
                this.getBookletDataSubscription = from(authData.access[AuthAccessKeyType.TEST]).pipe(
                  concatMap(bookletId => {
                    return this.bs.getBookletData(bookletId)
                  })).subscribe(bData => this.booklets.push(bData));
              }
              this.mds.setAuthData(authData);
            } else {
              this.mds.setAuthData();
            }
          } else {
            this.mds.setAuthData();
          }
        }
      })
    });
  }

  startBooklet(b: BookletData) {
    this.router.navigate(['/t', b.id]);
    /*
    this.bs.startBooklet(b.id).subscribe(
      startReturnUntyped => {
        if (startReturnUntyped instanceof ServerError) {
          const e = startReturnUntyped as ServerError;
          this.mds.globalErrorMsg$.next(e);
        } else {
          const startReturn = startReturnUntyped as PersonTokenAndTestId;
          this.mds.globalErrorMsg$.next(null);
          // ************************************************

          // by setting bookletDbId$ the test-controller will load the booklet
          this.dataLoading = true;
          this.mds.setBookletDbId(startReturn.personToken, startReturn.testId, b.label);


          // ************************************************
        }
      }
    );

     */
  }

  resetLogin() {
    this.mds.setAuthData();
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    if (this.getBookletDataSubscription !== null) {
      this.getBookletDataSubscription.unsubscribe();
    }
  }
}
