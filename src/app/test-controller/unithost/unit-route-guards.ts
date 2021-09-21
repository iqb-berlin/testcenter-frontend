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
import { CodeInputData, TestControllerState } from '../test-controller.interfaces';
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

    if (this.tcs.currentUnitSequenceId > 0) {
      this.tcs.updateMinMaxUnitSequenceId(this.tcs.currentUnitSequenceId);
    } else {
      this.tcs.updateMinMaxUnitSequenceId(targetUnitSequenceId);
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
    if (newUnit.unitDef.locked) {
      console.warn('unit canActivate: locked');
      return false;
    }
    if (newUnit.unitDef.canEnter === 'n') {
      console.warn('unit canEnter === n');
      return false;
    }

    return this.checkAndSolve_Code(newUnit, forceNavigation)
      .pipe(switchMap(cAsC => {
        if (!cAsC) {
          return of(false);
        }
        this.tcs.currentUnitSequenceId = targetUnitSequenceId;
        this.tcs.updateMinMaxUnitSequenceId(this.tcs.currentUnitSequenceId);
        return of(true);
      }));
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
    console.log('checkAndSolve_maxTime', { newUnit, force, tcs_currentMaxTimerTestletId: this.tcs.currentMaxTimerTestletId });
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
          console.log("['cancel here']", this.tcs.currentMaxTimerTestletId);
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
    if (!newUnit || this.tcs.currentUnitSequenceId < newUnit.unitDef.sequenceId) { // if going to menu for example
      return this.canGoForwards(newUnit);
    }
    return this.canGoBackwards();
  }

  private canGoForwards(newUnit: UnitControllerData): Observable<boolean> {
    let checkUnitSequenceId = this.tcs.currentUnitSequenceId;
    if (newUnit) {
      checkUnitSequenceId = newUnit.unitDef.sequenceId - 1;
    }
    while (checkUnitSequenceId >= this.tcs.currentUnitSequenceId) {
      const tmpUnit = this.tcs.rootTestlet.getUnitAt(checkUnitSequenceId);
      if (!tmpUnit.unitDef.locked) { // when forced jump by timer units will be locked but not presentationComplete
        const reasonsForNavigationDenial = this.checkCompleteness(checkUnitSequenceId, tmpUnit);
        if (reasonsForNavigationDenial.length) {
          return this.navigationForwardsDenied(reasonsForNavigationDenial);
        }
      }
      checkUnitSequenceId -= 1;
    }
    return of(true);
  }

  private checkCompleteness(checkUnitSequenceId: number, unit: UnitControllerData): VeronaNavigationDeniedReason[] {
    const reason: VeronaNavigationDeniedReason[] = [];
    if (
      (unit.unitDef.navigationLeaveRestrictions.presentationComplete === 'ON') &&
      this.tcs.hasUnitPresentationProgress(checkUnitSequenceId) &&
      (this.tcs.getUnitPresentationProgress(checkUnitSequenceId) !== 'complete')
    ) {
      reason.push('presentationIncomplete');
    }
    if (
      (unit.unitDef.navigationLeaveRestrictions.responseComplete === 'ON') &&
      this.tcs.hasUnitResponseProgress(checkUnitSequenceId) &&
      (['complete', 'complete-and-valid'].indexOf(this.tcs.getUnitResponseProgress(checkUnitSequenceId)) === -1)
    ) {
      reason.push('responsesIncomplete');
    }
    return reason;
  }

  private getCustomTexts(direction: 'Next'|'Prev', reasons: VeronaNavigationDeniedReason[]) {
    const customTexts = {
      presentationIncomplete: {
        title: this.cts.getCustomText(`booklet_msgPresentationNotCompleteTitle${direction}`),
        content: this.cts.getCustomText(`booklet_msgPresentationNotCompleteText${direction}`)
      },
      responsesIncomplete: {
        title: this.cts.getCustomText(`booklet_msgResponseNotCompleteTitle${direction}`),
        content: this.cts.getCustomText(`booklet_msgResponseNotCompleteText${direction}`)
      }
    };
    return {
      title: reasons.map(r => customTexts[r].title)[0],
      content: reasons.map(r => customTexts[r].content).join(' ')
    };
  }

  private navigationForwardsDenied(reasonsForNavigationDenial: VeronaNavigationDeniedReason[]): Observable<boolean> {
    this.tcs.notifyNavigationDenied(this.tcs.currentUnitSequenceId, reasonsForNavigationDenial);
    if (this.tcs.testMode.forceNaviRestrictions) {
      const customTexts = this.getCustomTexts('Next', reasonsForNavigationDenial);
      const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogData>{
          title: customTexts.title,
          content: customTexts.content,
          confirmbuttonlabel: 'OK',
          confirmbuttonreturn: false,
          showcancel: false
        }
      });
      return dialogCDRef.afterClosed().pipe(map(() => false));
    }
    this.snackBar.open(
      `Im Hot-Modus dürfte hier nicht weitergeblättert werden (${reasonsForNavigationDenial.join(', ')}).`,
      'Weiterblättern',
      { duration: 3000 }
    );
    return of(true);
  }

  private canGoBackwards(): Observable<boolean> {
    const currentUnit = this.tcs.rootTestlet.getUnitAt(this.tcs.currentUnitSequenceId);
    const reasonsForNavigationDenial = this.checkCompleteness(this.tcs.currentUnitSequenceId, currentUnit);
    if (reasonsForNavigationDenial.length) {
      return this.navigationBackwardsDenied(reasonsForNavigationDenial);
    }
    return of(true);
  }

  private navigationBackwardsDenied(reasonsForNavigationDenial: VeronaNavigationDeniedReason[]): Observable<boolean> {
    this.tcs.notifyNavigationDenied(this.tcs.currentUnitSequenceId, reasonsForNavigationDenial);
    if (this.tcs.testMode.forceNaviRestrictions) {
      const customTexts = this.getCustomTexts('Prev', reasonsForNavigationDenial);
      const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogData>{
          title: customTexts.title,
          content: customTexts.content,
          confirmbuttonlabel: 'Trotzdem zurück',
          confirmbuttonreturn: true,
          showcancel: true
        }
      });
      return dialogCDRef.afterClosed();
    }
    this.snackBar.open(
      `Im Hot-Modus dürfte hier nicht zurück geblättert werden (${reasonsForNavigationDenial.join(', ')}).`,
      'Zurückblättern',
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
