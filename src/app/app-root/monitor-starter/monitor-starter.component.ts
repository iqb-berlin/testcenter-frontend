import {Component, OnDestroy, OnInit} from '@angular/core';
import {AccessObject, AuthAccessKeyType, AuthData, WorkspaceData} from '../../app.interfaces';
import {from, Subscription} from "rxjs";
import {Router} from "@angular/router";
import {BackendService} from "../../backend.service";
import {MainDataService} from "../../maindata.service";
import {concatMap} from "rxjs/operators";
import {CustomtextService} from "iqb-components";

@Component({
  templateUrl: './monitor-starter.component.html',
  styles: [
    'mat-card {margin: 10px;}',
    '.mat-card-gray {background-color: lightgray}'
  ]
})
export class MonitorStarterComponent implements OnInit, OnDestroy {
  accessObjects: (WorkspaceData|AccessObject)[] = [];
  isWorkspaceMonitor = false;
  private getWorkspaceDataSubscription: Subscription = null;

  constructor(
    private router: Router,
    private bs: BackendService,
    public cts: CustomtextService,
    private mds: MainDataService
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.mds.setSpinnerOn();
      this.bs.getSessionData().subscribe(authDataUntyped => {
        if (typeof authDataUntyped !== 'number') {
          const authData = authDataUntyped as AuthData;
          if (authData) {
            if (authData.token) {
              this.accessObjects = [];
              let scopeIdList = [];
              if (authData.access[AuthAccessKeyType.TEST_GROUP_MONITOR]) {
                scopeIdList = authData.access[AuthAccessKeyType.TEST_GROUP_MONITOR];
                this.isWorkspaceMonitor = false;
              } else if (authData.access[AuthAccessKeyType.WORKSPACE_MONITOR]) {
                scopeIdList = authData.access[AuthAccessKeyType.WORKSPACE_MONITOR];
                this.isWorkspaceMonitor = true;
              }
              if (this.getWorkspaceDataSubscription !== null) {
                this.getWorkspaceDataSubscription.unsubscribe();
              }
              this.getWorkspaceDataSubscription = from(scopeIdList).pipe(
                concatMap(monitorScopeId => {
                  if (authData.access[AuthAccessKeyType.TEST_GROUP_MONITOR]) {
                    return this.bs.getGroupData(monitorScopeId)
                  } else if (authData.access[AuthAccessKeyType.WORKSPACE_MONITOR]) {
                    return this.bs.getWorkspaceData(monitorScopeId)
                  }
                })).subscribe(
                wsData => this.accessObjects.push(wsData),
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
      })
    });
  }

  buttonGotoMonitor(accessObject: AccessObject) {

    if (this.isWorkspaceMonitor) {
      this.router.navigateByUrl('/wm/' + accessObject.id.toString());
    } else {
      this.router.navigateByUrl('/gm/' + accessObject.id.toString());
    }
  }

  resetLogin() {
    this.mds.setAuthData();
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    if (this.getWorkspaceDataSubscription !== null) {
      this.getWorkspaceDataSubscription.unsubscribe();
    }
  }
}
