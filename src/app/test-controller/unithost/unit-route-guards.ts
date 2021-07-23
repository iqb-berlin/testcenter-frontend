/* eslint-disable max-classes-per-file,no-console */

import { ConfirmDialogComponent, ConfirmDialogData, CustomtextService } from 'iqb-components';
import {
  filter, map, switchMap, take
} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, CanActivate, CanDeactivate, Router, RouterStateSnapshot
} from '@angular/router';
import { interval, Observable, of } from 'rxjs';
import { MainDataService } from 'src/app/maindata.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CodeInputData } from '../test-controller.interfaces';
import { UnitControllerData } from '../test-controller.classes';
import { UnithostComponent } from './unithost.component';
import { TestControllerService } from '../test-controller.service';
import { TestControllerComponent } from '../test-controller.component';

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

  checkAndSolve_DefLoaded(newUnit: UnitControllerData): Observable<boolean> {
    if (this.tcs.loadComplete) {
      return of(true);
    }
    if (this.tcs.currentUnitSequenceId < newUnit.unitDef.sequenceId) {
      // 1 going forwards

      if ((newUnit.maxTimerRequiringTestlet === null) || (!this.tcs.testMode.forceNaviRestrictions)) {
        // 1 a) target is not in timed block or review mode --> check only target unit

        if (this.tcs.hasUnitDefinition(newUnit.unitDef.sequenceId)) {
          return of(true);
        }
        this.mds.setSpinnerOn();
        return interval(1000)
          .pipe(
            filter(() => this.tcs.hasUnitDefinition(newUnit.unitDef.sequenceId)),
            map(() => true),
            take(1)
          );
      }
      if (this.tcs.currentMaxTimerTestletId &&
        (newUnit.maxTimerRequiringTestlet.id === this.tcs.currentMaxTimerTestletId)
      ) {
        // 1 b) staying in timed block --> check has been already done
        return of(true);
      }

      // entering timed block --> check all units
      const allUnitsSequenceIdsToCheck =
        this.tcs.rootTestlet.getAllUnitSequenceIds(newUnit.maxTimerRequiringTestlet.id);
      let ok = true;
      allUnitsSequenceIdsToCheck.forEach(u => {
        if (!this.tcs.hasUnitDefinition(u)) {
          ok = false;
        }
      });
      if (ok) {
        return of(true);
      }
      this.mds.setSpinnerOn();
      return interval(1000)
        .pipe(
          filter(() => {
            let localOk = true;
            allUnitsSequenceIdsToCheck.forEach(u => {
              if (!this.tcs.hasUnitDefinition(u)) {
                localOk = false;
              }
            });
            return localOk;
          }),
          map(() => true),
          take(1)
        );
    }
    // 2 going backwards --> no check, because units are loaded in ascending order
    return of(true);
  }

  // TODO is it correct, that always returns always of(true)
  checkAndSolve_maxTime(newUnit: UnitControllerData): Observable<boolean> {
    if (newUnit.maxTimerRequiringTestlet === null) {
      return of(true);
    }
    if (this.tcs.currentMaxTimerTestletId &&
      (newUnit.maxTimerRequiringTestlet.id === this.tcs.currentMaxTimerTestletId)
    ) {
      return of(true);
    }
    this.tcs.cancelMaxTimer();
    this.tcs.rootTestlet.lockUnits_before(newUnit.maxTimerRequiringTestlet.id);
    this.tcs.startMaxTimer(newUnit.maxTimerRequiringTestlet.id, newUnit.maxTimerRequiringTestlet.maxTimeLeft);
    return of(true);
  }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean>|boolean {
    const targetUnitSequenceId: number = Number(route.params.u);
    if (this.tcs.currentUnitSequenceId > 0) {
      this.tcs.updateMinMaxUnitSequenceId(this.tcs.currentUnitSequenceId);
    } else {
      this.tcs.updateMinMaxUnitSequenceId(targetUnitSequenceId);
    }
    let forceNavigation = false;
    const routerStateObject = this.router.getCurrentNavigation();
    if (routerStateObject.extras.state && routerStateObject.extras.state.force) {
      forceNavigation = routerStateObject.extras.state.force;
    }

    let myReturn = false;
    if (this.tcs.rootTestlet === null) {
      console.warn('unit canActivate: true (rootTestlet null)');
      myReturn = false;
      const oldTestId = localStorage.getItem(TestControllerComponent.localStorageTestKey);
      if (oldTestId) {
        this.router.navigate([`/t/${oldTestId}`]);
      } else {
        this.router.navigate(['/']);
      }
    } else if ((targetUnitSequenceId < this.tcs.minUnitSequenceId) ||
      (targetUnitSequenceId > this.tcs.maxUnitSequenceId)) {
      console.warn('unit canActivate: false (unit# out of range)');
      myReturn = false;
    } else {
      const newUnit: UnitControllerData = this.tcs.rootTestlet.getUnitAt(targetUnitSequenceId);
      if (!newUnit) {
        myReturn = false;
        console.warn(`target unit null (targetUnitSequenceId: ${targetUnitSequenceId.toString()})`);
      } else if (newUnit.unitDef.locked) {
        myReturn = false;
        console.warn('unit canActivate: locked');
      } else if (newUnit.unitDef.canEnter === 'n') {
        myReturn = false;
        console.warn('unit canActivate: false (unit is locked)');
      } else {
        return this.checkAndSolve_Code(newUnit, forceNavigation)
          .pipe(switchMap(cAsC => {
            if (!cAsC) {
              return of(false);
            }
            return this.checkAndSolve_DefLoaded(newUnit)
              .pipe(switchMap(cAsDL => {
                this.mds.setSpinnerOff();
                if (!cAsDL) {
                  return of(false);
                }
                return this.checkAndSolve_maxTime(newUnit)
                  .pipe(switchMap(cAsMT => {
                    if (!cAsMT) {
                      return of(false);
                    }
                    this.tcs.currentUnitSequenceId = targetUnitSequenceId;
                    this.tcs.updateMinMaxUnitSequenceId(this.tcs.currentUnitSequenceId);
                    return of(true);
                  }));
              }));
          }));
      }
    }
    return myReturn;
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
    if (this.tcs.currentMaxTimerTestletId) {
      if (newUnit && newUnit.maxTimerRequiringTestlet &&
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
            this.tcs.cancelMaxTimer();
            return true;
          })
        );
    }
    return of(true);
  }

  private checkAndSolve_PresentationCompleteCode(newUnit: UnitControllerData, force: boolean): Observable<boolean> {
    if (force) {
      return of(true);
    }
    if ((this.tcs.bookletConfig.force_presentation_complete !== 'ON') || this.tcs.currentUnitSequenceId <= 0) {
      return of(true);
    }
    if (!newUnit || this.tcs.currentUnitSequenceId < newUnit.unitDef.sequenceId) {
      // go forwards ===================================
      let myreturn = true;
      let checkUnitSequenceId = this.tcs.currentUnitSequenceId;
      if (newUnit) {
        checkUnitSequenceId = newUnit.unitDef.sequenceId - 1;
      }
      while (myreturn && (checkUnitSequenceId >= this.tcs.currentUnitSequenceId)) {
        const tmpUnit = this.tcs.rootTestlet.getUnitAt(checkUnitSequenceId);
        if (!tmpUnit.unitDef.locked) { // when forced jump by timer units will be locked but not presentationComplete
          if (this.tcs.hasUnitPresentationProgress(checkUnitSequenceId)) {
            if (this.tcs.getUnitPresentationProgress(checkUnitSequenceId) !== 'complete') {
              this.tcs.addNavigationDeniedEvent(this.tcs.currentUnitSequenceId, ['presentationIncomplete']);
              myreturn = false;
            }
          } else {
            myreturn = false;
          }
        }
        checkUnitSequenceId -= 1;
      }
      if (myreturn) {
        return of(true);
      }
      if (this.tcs.testMode.forceNaviRestrictions) {
        const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
          width: '500px',
          // height: '300px',
          data: <ConfirmDialogData>{
            title: this.cts.getCustomText('booklet_msgPresentationNotCompleteTitleNext'),
            content: this.cts.getCustomText('booklet_msgPresentationNotCompleteTextNext'),
            confirmbuttonlabel: 'OK',
            confirmbuttonreturn: false,
            showcancel: false
          }
        });
        return dialogCDRef.afterClosed().pipe(map(() => false));
      }
      this.snackBar.open('Im Hot-Modus dürfte hier nicht weitergeblättert werden (PresentationNotComplete).',
        'Weiterblättern', { duration: 3000 });
      return of(true);
    }
    // go backwards ===================================
    if (!this.tcs.hasUnitPresentationProgress(this.tcs.currentUnitSequenceId) ||
      (this.tcs.getUnitPresentationProgress(this.tcs.currentUnitSequenceId) === 'complete')
    ) {
      return of(true);
    }
    if (this.tcs.testMode.forceNaviRestrictions) {
      const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
        width: '500px',
        // height: '300px',
        data: <ConfirmDialogData>{
          title: this.cts.getCustomText('booklet_msgPresentationNotCompleteTitlePrev'),
          content: this.cts.getCustomText('booklet_msgPresentationNotCompleteTextPrev'),
          confirmbuttonlabel: 'Trotzdem zurück',
          confirmbuttonreturn: true,
          showcancel: true
        }
      });
      return dialogCDRef.afterClosed();
    }
    this.snackBar.open('Im Hot-Modus käme eine Warnung (PresentationNotComplete).',
      'Zurückblättern', { duration: 3000 });
    return of(true);
  }

  canDeactivate(component: UnithostComponent, currentRoute: ActivatedRouteSnapshot,
                currentState: RouterStateSnapshot, nextState: RouterStateSnapshot): Observable<boolean> | boolean {
    let newUnit: UnitControllerData = null;
    if (/t\/\d+\/u\/\d+$/.test(nextState.url)) {
      const targetUnitSequenceId = Number(nextState.url.match(/\d+$/)[0]);
      newUnit = this.tcs.rootTestlet.getUnitAt(targetUnitSequenceId);
    }
    let forceNavigation = false;
    const routerStateObject = this.router.getCurrentNavigation();
    if (routerStateObject.extras.state && routerStateObject.extras.state.force) {
      forceNavigation = routerStateObject.extras.state.force;
    }

    return this.checkAndSolve_maxTime(newUnit, forceNavigation)
      .pipe(
        switchMap(cAsC => {
          if (!cAsC) {
            return of(false);
          }
          return this.checkAndSolve_PresentationCompleteCode(newUnit, forceNavigation);
        })
      );
  }

  private navigationDenied(presentationProgress: string) {

  }
}

export const unitRouteGuards = [UnitActivateGuard, UnitDeactivateGuard];
