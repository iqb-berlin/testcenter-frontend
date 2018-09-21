import { UnitDef, TestControllerService } from './../test-controller.service';
import { switchMap, map } from 'rxjs/operators';
import { BackendService, ServerError } from './../backend.service';
import { UnithostComponent } from './unithost.component';
import { Injectable, Component } from '@angular/core';
import { CanActivate, CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot, Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable()
export class UnitActivateGuard implements CanActivate {
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      console.log('UnitActivateGuard');
    return true;
  }
}

@Injectable()
export class UnitDeactivateGuard implements CanDeactivate<UnithostComponent> {
  canDeactivate(
    component: UnithostComponent,
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      console.log('UnitDeactivateGuard');
    return true;
  }
}

@Injectable()
// enriches the routing data with unit data and resources:
// places in data['unit'] the unit object
export class UnitResolver implements Resolve<UnitDef> {
  constructor(private tcs: TestControllerService,
  private bs: BackendService) { }

  resolve(next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<UnitDef> {
      if (this.tcs.authorisation$.getValue() !== null) {
        return of(this.tcs.getUnitForPlayer(next.params['u']));
      } else {
        return null;
      }
    }
}


export const routingProviders = [UnitActivateGuard, UnitDeactivateGuard, UnitResolver];
