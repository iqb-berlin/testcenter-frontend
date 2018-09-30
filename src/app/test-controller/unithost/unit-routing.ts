import { UnitDef, TestControllerService } from './../test-controller.service';
import { switchMap, map } from 'rxjs/operators';
import { BackendService } from './../backend.service';
import { UnithostComponent } from './unithost.component';
import { Injectable, Component } from '@angular/core';
import { CanActivate, CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot, Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable()
export class UnitActivateGuard implements CanActivate {
  constructor(
    private tcs: TestControllerService,
    private bs: BackendService
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    const targetUnitSequenceId: number = +next.params['u'];
    const currentBooklet = this.tcs.booklet$.getValue();

    if (currentBooklet === null) {
      console.log('booklet null');
    } else if ((targetUnitSequenceId < 0) || (currentBooklet.units.length < targetUnitSequenceId - 1)) {
      console.log('unit# out of range');
    } else {
      const newUnit = currentBooklet.getUnitAt(targetUnitSequenceId);
      if (newUnit.locked) {
        console.log('unit is locked');
      // } else if (!this.bs.isItemplayerReady(newUnit.unitDefinitionType)) {
      //   console.log('itemplayer for unit not available');
      } else {
        this.tcs.setCurrentUnit(targetUnitSequenceId);
      }
    }

    return true;
  }
}

  // // 7777777777777777777777777777777777777777777777777777777777777777777777
  // isItemplayerReady(unitDefinitionType: string): boolean {
  //   unitDefinitionType = this.normaliseFileName(unitDefinitionType, 'html');
  //   return (unitDefinitionType.length > 0) && this.itemplayers.hasOwnProperty(unitDefinitionType);
  // }


@Injectable()
export class UnitDeactivateGuard implements CanDeactivate<UnithostComponent> {
  constructor(
    private tcs: TestControllerService,
    private bs: BackendService
  ) {}

  canDeactivate(
    component: UnithostComponent,
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    console.log('left unit');
    return true;
  }
}

@Injectable()
// enriches the routing data with unit data and resources:
// places in data['unit'] the unit object
export class UnitResolver implements Resolve<UnitDef> {
  constructor(private tcs: TestControllerService) { }

  resolve(next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<UnitDef> {

    // const targetUnitSequenceId = next.params['u'] as number;
    // const currentBooklet = this.tcs.booklet$.getValue();
    // const newUnit = currentBooklet.units[targetUnitSequenceId];
    // this.tcs.currentUnit$.next(newUnit);
    // return of(newUnit);
    return null;
  }
}


export const unitRoutingProviders = [UnitActivateGuard, UnitDeactivateGuard, UnitResolver];
