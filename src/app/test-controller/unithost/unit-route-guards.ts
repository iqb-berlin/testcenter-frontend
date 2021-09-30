/* eslint-disable max-classes-per-file,no-console */

import { ConfirmDialogComponent, ConfirmDialogData, CustomtextService } from 'iqb-components';
import { map, switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, CanActivate, CanDeactivate, Router, RouterStateSnapshot
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { MainDataService } from 'src/app/maindata.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CodeInputData, NavigationLeaveRestrictionValue, TestControllerState } from '../test-controller.interfaces';
import { UnitControllerData } from '../test-controller.classes';
import { UnithostComponent } from './unithost.component';
import { TestControllerService } from '../test-controller.service';
import { VeronaNavigationDeniedReason } from '../verona.interfaces';
import { LocalStorage } from '../local-storage.util';

@Injectable()
export class UnitActivateGuard implements CanActivate {
  constructor(
    private tcs: TestControllerService,
    private mds: MainDataService,
    private router: Router
  ) {}

  private checkAndSolve_Code(newUnit: UnitControllerData, force: boolean): Observable<boolean> {
    if (newUnit.codeRequiringTestlets) {
      if (newUnit.codeRequiringTestlets.length > 0) {
        const codes: CodeInputData[] = [];
        newUnit.codeRequiringTestlets.forEach(t => {
          if (force) {
            t.codeToEnter = '';
            this.tcs.addClearedCodeTestlet(t.id);
          } else {
            codes.push(<CodeInputData>{
              testletId: t.id,
              prompt: t.codePrompt,
              code: t.codeToEnter.toUpperCase().trim(),
              value: this.tcs.testMode.presetCode ? t.codeToEnter : ''
            });
          }
        });
        if (codes.length > 0) {
          this.router.navigate([`/t/${this.tcs.testId}/unlock`], {
            skipLocationChange: true,
            state: { returnTo: `/t/${this.tcs.testId}/u/${this.tcs.currentUnitSequenceId}`, newUnit, codes }
          });
          return of(false);
        }
        return of(true);
      }
      return of(true);
    }
    return of(true);
  }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean>|boolean {
    const targetUnitSequenceId: number = Number(route.params.u);
    let forceNavigation = false;
    const routerStateObject = this.router.getCurrentNavigation();
    if (routerStateObject.extras.state && routerStateObject.extras.state.force) {
      forceNavigation = routerStateObject.extras.state.force;
    }

    if (this.tcs.rootTestlet === null) {
      console.warn('unit canActivate: true (rootTestlet null)');
      const oldTestId = LocalStorage.getTestId();
      if (oldTestId) {
        this.router.navigate([`/t/${oldTestId}`]);
      } else {
        this.router.navigate(['/']);
      }
      return false;
    }
    const newUnit: UnitControllerData = this.tcs.rootTestlet.getUnitAt(targetUnitSequenceId);
    if (!newUnit) {
      console.warn(`target unit null (targetUnitSequenceId: ${targetUnitSequenceId.toString()})`);
      return false;
    }
    return this.checkAndSolve_Code(newUnit, forceNavigation);
  }
}

@Injectable()
export class UnitDeactivateGuard implements CanDeactivate<UnithostComponent> {
  constructor(
    private tcs: TestControllerService,
    private cts: CustomtextService,
    public confirmDialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  private checkAndSolve_maxTime(newUnit: UnitControllerData, force: boolean): Observable<boolean> {
    if (!this.tcs.currentMaxTimerTestletId) { // leaving unit is not in a timed block
      return of(true);
    }
    if (newUnit && newUnit.maxTimerRequiringTestlet && // staying in the same timed block
      (newUnit.maxTimerRequiringTestlet.id === this.tcs.currentMaxTimerTestletId)
    ) {
      return of(true);
    }
    if (force) {
      this.tcs.interruptMaxTimer();
      return of(true);
    }
    const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
      width: '500px',
      data: <ConfirmDialogData>{
        title: this.cts.getCustomText('booklet_warningLeaveTimerBlockTitle'),
        content: this.cts.getCustomText('booklet_warningLeaveTimerBlockTextPrompt'),
        confirmbuttonlabel: 'Trotzdem weiter',
        confirmbuttonreturn: true,
        showcancel: true
      }
    });
    return dialogCDRef.afterClosed()
      .pipe(
        map(cdresult => {
          if ((typeof cdresult === 'undefined') || (cdresult === false)) {
            return false;
          }
          this.tcs.cancelMaxTimer(); // does locking the block
          return true;
        })
      );
  }

  private checkAndSolve_Completeness(newUnit: UnitControllerData, force: boolean): Observable<boolean> {
    if (force) {
      return of(true);
    }
    if (this.tcs.currentUnitSequenceId <= 0) { // TODO is this even possible
      return of(true);
    }
    const direction = (newUnit && this.tcs.currentUnitSequenceId < newUnit.unitDef.sequenceId) ? 'Next' : 'Prev';
    const reasons = this.checkCompleteness(direction);
    if (!reasons.length) {
      return of(true);
    }
    return this.notifyNavigationDenied(reasons, direction);
  }

  private checkCompleteness(direction: 'Next'|'Prev'): VeronaNavigationDeniedReason[] {
    const unit = this.tcs.rootTestlet.getUnitAt(this.tcs.currentUnitSequenceId);
    const reasons: VeronaNavigationDeniedReason[] = [];
    const valuesAllowed = {
      Next: <NavigationLeaveRestrictionValue[]>['ON', 'FORWARD_ONLY'],
      Prev: <NavigationLeaveRestrictionValue[]>['ON']
    };
    if (
      (valuesAllowed[direction].indexOf(unit.unitDef.navigationLeaveRestrictions.presentationComplete) > -1) &&
      this.tcs.hasUnitPresentationProgress(this.tcs.currentUnitSequenceId) &&
      (this.tcs.getUnitPresentationProgress(this.tcs.currentUnitSequenceId) !== 'complete')
    ) {
      reasons.push('presentationIncomplete');
    }
    if (
      (valuesAllowed[direction].indexOf(unit.unitDef.navigationLeaveRestrictions.responseComplete) > -1) &&
      this.tcs.hasUnitResponseProgress(this.tcs.currentUnitSequenceId) &&
      (['complete', 'complete-and-valid']
        .indexOf(this.tcs.getUnitResponseProgress(this.tcs.currentUnitSequenceId)) === -1
      )
    ) {
      reasons.push('responsesIncomplete');
    }
    console.log({
      direction,
      reasons,
      valuesAllowed: valuesAllowed[direction],
      navigationLeaveRestrictions: unit.unitDef.navigationLeaveRestrictions,
      getUnitPresentationProgress: this.tcs.getUnitPresentationProgress(this.tcs.currentUnitSequenceId),
      getUnitResponseProgress: this.tcs.getUnitResponseProgress(this.tcs.currentUnitSequenceId)
    });
    return reasons;
  }

  private notifyNavigationDenied(reasons: VeronaNavigationDeniedReason[], dir: 'Next' | 'Prev'): Observable<boolean> {
    if (this.tcs.testMode.forceNaviRestrictions) {
      this.tcs.notifyNavigationDenied(this.tcs.currentUnitSequenceId, reasons);

      const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogData>{
          title: this.cts.getCustomText('booklet_msgNavigationDeniedTitle'),
          content: reasons.map(r => this.cts.getCustomText(`booklet_msgNavigationDeniedText_${r}`)).join(' '),
          confirmbuttonlabel: 'OK',
          confirmbuttonreturn: false,
          showcancel: false
        }
      });
      return dialogCDRef.afterClosed().pipe(map(() => false));
    }
    this.snackBar.open(
      `Im Hot-Modus dürfte hier nicht ${(dir === 'Next') ? 'weiter' : ' zurück'}geblättert
                werden: ${reasons.join(', ')}.`,
      'Blättern',
      { duration: 3000 }
    );
    return of(true);
  }

  canDeactivate(component: UnithostComponent, currentRoute: ActivatedRouteSnapshot,
                currentState: RouterStateSnapshot, nextState: RouterStateSnapshot): Observable<boolean> | boolean {
    if (this.tcs.testStatus$.getValue() === TestControllerState.ERROR) {
      return true;
    }

    if (nextState.url === '/r/route-dispatcher') { // clicking on the IQB-Logo
      return true;
    }

    let newUnit: UnitControllerData = null;
    if (/t\/\d+\/u\/\d+$/.test(nextState.url)) {
      const targetUnitSequenceId = Number(nextState.url.match(/\d+$/)[0]);
      newUnit = this.tcs.rootTestlet.getUnitAt(targetUnitSequenceId);
    }

    const forceNavigation = this.router.getCurrentNavigation().extras?.state?.force ?? false;

    return this.checkAndSolve_maxTime(newUnit, forceNavigation)
      .pipe(
        switchMap(cAsC => {
          if (!cAsC) {
            return of(false);
          }
          return this.checkAndSolve_Completeness(newUnit, forceNavigation);
        })
      );
  }
}

export const unitRouteGuards = [UnitActivateGuard, UnitDeactivateGuard];
