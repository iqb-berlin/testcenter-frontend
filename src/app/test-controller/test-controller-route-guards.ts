import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {TestControllerComponent} from './test-controller.component';
import {TestStatus, UnitNavigationTarget} from './test-controller.interfaces';
import {TestControllerService} from './test-controller.service';

@Injectable({
  providedIn: 'root'
})
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
        this.tcs.setUnitNavigationRequest(UnitNavigationTarget.MENU);
      } else {
        localStorage.removeItem(TestControllerComponent.localStorageTestKey);
        return true;
      }
    } else {
      localStorage.removeItem(TestControllerComponent.localStorageTestKey);
      return true;
    }
  }
}
