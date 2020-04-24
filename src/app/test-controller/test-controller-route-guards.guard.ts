import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, CanDeactivate} from '@angular/router';
import { Observable } from 'rxjs';
import {TestControllerComponent} from "./test-controller.component";

@Injectable({
  providedIn: 'root'
})
export class TestControllerDeactivateGuard implements CanDeactivate<TestControllerComponent> {
  canDeactivate(
    component: TestControllerComponent,
    currentRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    console.log('TestControllerDeactivateGuard passed');

    return true;
  }

}
