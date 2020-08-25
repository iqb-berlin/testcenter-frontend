import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, CanDeactivate, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {TestControllerComponent} from './test-controller.component';
import {TestStatus, UnitNavigationTarget} from './test-controller.interfaces';
import {TestControllerService} from './test-controller.service';

@Injectable()
export class TestControllerDeactivateGuard implements CanDeactivate<TestControllerComponent> {
  constructor(
    private tcs: TestControllerService,
  ) {
  }

  canDeactivate(
    component: TestControllerComponent,
    currentRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    if (this.tcs.testMode.saveResponses) {
      const testStatus: TestStatus = this.tcs.testStatus$.getValue();
      if ((testStatus !== TestStatus.ERROR) && (testStatus !== TestStatus.TERMINATED)) {
        if (this.tcs.bookletConfig.unit_menu !== 'OFF' || this.tcs.testMode.showUnitMenu) {
          this.tcs.setUnitNavigationRequest(UnitNavigationTarget.MENU);
        } else {
          this.tcs.setUnitNavigationRequest(UnitNavigationTarget.PAUSE);
        }
        return false;
      } else {
        localStorage.removeItem(TestControllerComponent.localStorageTestKey);
        localStorage.removeItem(TestControllerComponent.localStoragePausedKey);
        return true;
      }
    } else {
      localStorage.removeItem(TestControllerComponent.localStorageTestKey);
      localStorage.removeItem(TestControllerComponent.localStoragePausedKey);
      return true;
    }
  }
}

@Injectable()
export class TestControllerErrorPausedActivateGuard implements CanActivate {
  constructor(
    private tcs: TestControllerService
  ) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    const testStatus: TestStatus = this.tcs.testStatus$.getValue();
    return (testStatus !== TestStatus.ERROR) && (testStatus !== TestStatus.TERMINATED) && (testStatus !== TestStatus.PAUSED)
  }
}

export const testControllerRouteGuards = [TestControllerDeactivateGuard, TestControllerErrorPausedActivateGuard];
