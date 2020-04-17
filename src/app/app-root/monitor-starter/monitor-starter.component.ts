import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthAccessKeyType, AuthData, MonitorScopeData} from "../../app.interfaces";
import {from, Subscription} from "rxjs";
import {Router} from "@angular/router";
import {BackendService} from "../../backend.service";
import {MainDataService} from "../../maindata.service";
import {concatMap} from "rxjs/operators";

@Component({
  templateUrl: './monitor-starter.component.html'
})
export class MonitorStarterComponent implements OnInit, OnDestroy {
  monitorScopes: MonitorScopeData[] = [];
  private getMonitorScopeDataSubscription: Subscription = null;

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
              this.monitorScopes = [];
              let scopeIdList = [];
              if (authData.access[AuthAccessKeyType.TEST_GROUP_MONITOR]) {
                scopeIdList = authData.access[AuthAccessKeyType.TEST_GROUP_MONITOR];
              } else if (authData.access[AuthAccessKeyType.WORKSPACE_MONITOR]) {
                scopeIdList = authData.access[AuthAccessKeyType.WORKSPACE_MONITOR];
              }
              this.getMonitorScopeDataSubscription = from(scopeIdList).pipe(
                concatMap(monitorScopeId => {
                  return this.bs.getMonitorScopeData(monitorScopeId)
                })).subscribe(msData => this.monitorScopes.push(msData));
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

  buttonGotoMonitor(ms: MonitorScopeData) {
    switch (ms.type) {
      case "GROUP":
        this.router.navigateByUrl('/group-monitor/' + ms.id.toString());
        break;
      case "WORKSPACE":
        this.router.navigateByUrl('/workspace-monitor/' + ms.id.toString());
        break;
    }
  }

  resetLogin() {
    this.mds.setAuthData();
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    if (this.getMonitorScopeDataSubscription !== null) {
      this.getMonitorScopeDataSubscription.unsubscribe();
    }
  }
}
