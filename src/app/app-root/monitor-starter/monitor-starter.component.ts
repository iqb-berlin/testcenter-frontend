import { Component, OnDestroy, OnInit } from '@angular/core';
import { from, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { concatMap } from 'rxjs/operators';
import { CustomtextService } from 'iqb-components';
import { BackendService } from '../../backend.service';
import { MainDataService } from '../../maindata.service';
import {
  AccessObject, AuthAccessKeyType, AuthData, WorkspaceData
} from '../../app.interfaces';

@Component({
  templateUrl: './monitor-starter.component.html',
  styles: [
    'mat-card {margin: 10px;}',
    '.mat-card-gray {background-color: lightgray}'
  ]
})
export class MonitorStarterComponent implements OnInit, OnDestroy {
  accessObjects: (WorkspaceData|AccessObject)[] = [];

  private getWorkspaceDataSubscription: Subscription = null;

  constructor(
    private router: Router,
    private bs: BackendService,
    public cts: CustomtextService,
    private mds: MainDataService
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.mds.setSpinnerOn();
      this.bs.getSessionData().subscribe((authDataUntyped) => {
        if (typeof authDataUntyped !== 'number') {
          const authData = authDataUntyped as AuthData;
          if (authData) {
            if (authData.token) {
              this.accessObjects = [];
              let scopeIdList = [];
              if (authData.access[AuthAccessKeyType.TEST_GROUP_MONITOR]) {
                scopeIdList = authData.access[AuthAccessKeyType.TEST_GROUP_MONITOR];
              }
              if (this.getWorkspaceDataSubscription !== null) {
                this.getWorkspaceDataSubscription.unsubscribe();
              }
              this.getWorkspaceDataSubscription = from(scopeIdList).pipe(
                concatMap((monitorScopeId) => {
                  let functionReturn = null;
                  if (authData.access[AuthAccessKeyType.TEST_GROUP_MONITOR]) {
                    functionReturn = this.bs.getGroupData(monitorScopeId);
                  }
                  return functionReturn;
                })
              ).subscribe(
                (wsData: AccessObject) => {
                  if (wsData) {
                    this.accessObjects.push(wsData);
                  }
                },
                () => this.mds.setSpinnerOff(),
                () => this.mds.setSpinnerOff()
              );
              this.mds.setAuthData(authData);
            } else {
              this.mds.setAuthData();
              this.mds.setSpinnerOff();
            }
          } else {
            this.mds.setAuthData();
            this.mds.setSpinnerOff();
          }
        } else {
          this.mds.setSpinnerOff();
        }
      });
    });
  }

  buttonGotoMonitor(accessObject: AccessObject): void {
    this.router.navigateByUrl(`/gm/${accessObject.id.toString()}`);
  }

  resetLogin(): void {
    this.mds.setAuthData();
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    if (this.getWorkspaceDataSubscription !== null) {
      this.getWorkspaceDataSubscription.unsubscribe();
    }
  }
}
