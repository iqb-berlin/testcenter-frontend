import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthAccessKeyType, AuthData, WorkspaceData} from "../../app.interfaces";
import {from, Subscription} from "rxjs";
import {Router} from "@angular/router";
import {BackendService} from "../../backend.service";
import {MainDataService} from "../../maindata.service";
import {concatMap} from "rxjs/operators";

@Component({
  templateUrl: './monitor-starter.component.html'
})
export class MonitorStarterComponent implements OnInit, OnDestroy {
  workspaces: WorkspaceData[] = [];
  isWorkspaceMonitor = false;
  private getWorkspaceDataSubscription: Subscription = null;

  constructor(
    private router: Router,
    private bs: BackendService,
    private mds: MainDataService
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.bs.getSessionData().subscribe(authDataUntyped => {
        if (typeof authDataUntyped !== 'number') {
          const authData = authDataUntyped as AuthData;
          if (authData) {
            if (authData.token) {
              this.workspaces = [];
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
                  return this.bs.getWorkspaceData(monitorScopeId)
                })).subscribe(wsData => this.workspaces.push(wsData));
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

  buttonGotoMonitor(ms: WorkspaceData) {
    if (this.isWorkspaceMonitor) {
      this.router.navigateByUrl('/workspace-monitor/' + ms.id.toString());
    } else {
      this.router.navigateByUrl('/group-monitor/' + ms.id.toString());
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
