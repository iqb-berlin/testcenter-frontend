import {ConfirmDialogComponent, ConfirmDialogData, CustomtextService} from 'iqb-components';
import {TestControllerService} from '../test-controller.service';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {UnithostComponent} from './unithost.component';
import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, CanDeactivate, Router, RouterStateSnapshot} from '@angular/router';
import {interval, Observable, of} from 'rxjs';
import {UnitControllerData} from '../test-controller.classes';
import {CodeInputData, LogEntryKey} from '../test-controller.interfaces';
import {MainDataService} from 'src/app/maindata.service';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TestControllerComponent} from '../test-controller.component';

@Injectable()
export class UnitActivateGuard implements CanActivate {
  constructor(
    private tcs: TestControllerService,
    private mds: MainDataService,
    public startLockDialog: MatDialog,
    private router: Router,
    public confirmDialog: MatDialog,
    private snackBar: MatSnackBar,
    private cts: CustomtextService
  ) {}


  checkAndSolve_PresentationCompleteCode(newUnit: UnitControllerData): Observable<Boolean> {
    if ((this.tcs.bookletConfig.force_presentation_complete === 'ON') && this.tcs.currentUnitSequenceId > 0) {
      if (this.tcs.currentUnitSequenceId < newUnit.unitDef.sequenceId) {
        // go forwards ===================================
        let myreturn = true;
        let checkUnitSequenceId = newUnit.unitDef.sequenceId - 1;
        while (myreturn && (checkUnitSequenceId >= this.tcs.currentUnitSequenceId)) {
          const tmpUnit = this.tcs.rootTestlet.getUnitAt(checkUnitSequenceId);
          if (!tmpUnit.unitDef.locked) { // when forced jump by timer units will be locked but not presentationComplete
            if (this.tcs.hasUnitPresentationComplete(checkUnitSequenceId)) {
              if (this.tcs.getUnitPresentationComplete(checkUnitSequenceId) !== 'complete') {
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
        } else {
          if (this.tcs.testMode.forceNaviRestrictions) {
            const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
              width: '500px',
              // height: '300px',
              data:  <ConfirmDialogData>{
                title: this.cts.getCustomText('booklet_msgPresentationNotCompleteTitleNext'),
                content: this.cts.getCustomText('booklet_msgPresentationNotCompleteTextNext'),
                confirmbuttonlabel: 'OK',
                confirmbuttonreturn: false,
                showcancel: false
              }
            });
            return dialogCDRef.afterClosed().pipe(map(() => false));
          } else {
            this.snackBar.open('Im Hot-Modus dürfte hier nicht weitergeblättert werden (PresentationNotComplete).',
                'Weiterblättern', {duration: 3000});
            return of(true);
          }
        }
      } else {
        // go backwards ===================================
        let myreturn = true;
        if (this.tcs.hasUnitPresentationComplete(this.tcs.currentUnitSequenceId)) {
          if (this.tcs.getUnitPresentationComplete(this.tcs.currentUnitSequenceId) !== 'complete') {
            myreturn = false;
          }
        } else {
          myreturn = false;
        }
        if (myreturn) {
          return of(true);
        } else {
          if (this.tcs.testMode.forceNaviRestrictions) {
            const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
              width: '500px',
              // height: '300px',
              data:  <ConfirmDialogData>{
                title: this.cts.getCustomText('booklet_msgPresentationNotCompleteTitlePrev'),
                content: this.cts.getCustomText('booklet_msgPresentationNotCompleteTextPrev'),
                confirmbuttonlabel: 'Trotzdem zurück',
                confirmbuttonreturn: true,
                showcancel: true
              }
            });
            return dialogCDRef.afterClosed();
          } else {
            this.snackBar.open('Im Hot-Modus käme eine Warnung (PresentationNotComplete).',
                'Zurückblättern', {duration: 3000});
            return of(true);
          }
        }
      }
    } else {
      return of(true);
    }
  }


  checkAndSolve_Code(newUnit: UnitControllerData, force: boolean): Observable<Boolean> {
    if (newUnit.codeRequiringTestlets) {
      if (newUnit.codeRequiringTestlets.length > 0) {
        const myCodes: CodeInputData[] = [];
        newUnit.codeRequiringTestlets.forEach(t => {
          if (force) {
            t.codeToEnter = '';
          } else {
            myCodes.push(<CodeInputData>{
              testletId: t.id,
              prompt: t.codePrompt,
              code: t.codeToEnter.toUpperCase().trim(),
              value: this.tcs.testMode.presetCode ? t.codeToEnter : ''
            });
          }
        });
        if (myCodes.length > 0) {
          this.router.navigate([`/t/${this.tcs.testId}/unlock`], {
            skipLocationChange: true,
            state: {
              returnTo: `/t/${this.tcs.testId}/u/${this.tcs.currentUnitSequenceId}`,
              newUnit: newUnit,
              codes: myCodes
            }
          });
          return of(false);
        } else {
          return of(true);
        }
      } else {
        return of(true);
      }
    } else {
      return of(true);
    }
  }

  checkAndSolve_DefLoaded(newUnit: UnitControllerData): Observable<Boolean> {
    if (this.tcs.loadComplete) {
      return of(true);
    } else {
      if (this.tcs.currentUnitSequenceId < newUnit.unitDef.sequenceId) {

        // 1 going forwards

        if ((newUnit.maxTimerRequiringTestlet === null) || (!this.tcs.testMode.forceNaviRestrictions)) {

          // 1 a) target is not in timed block or review mode --> check only target unit

          if (this.tcs.hasUnitDefinition(newUnit.unitDef.sequenceId)) {
            return of(true);
          } else {
            this.mds.setSpinnerOn();
            return interval(1000)
              .pipe(
                filter(() => this.tcs.hasUnitDefinition(newUnit.unitDef.sequenceId)),
                map(() => true),
                take(1)
              );
          }
        } else if (this.tcs.currentMaxTimerTestletId && (newUnit.maxTimerRequiringTestlet.id === this.tcs.currentMaxTimerTestletId)) {

          // 1 b) staying in timed block --> check has been already done

          return of(true);

        } else {

          // entering timed block --> check all units
          const allUnitsSequenceIdsToCheck = this.tcs.rootTestlet.getAllUnitSequenceIds(newUnit.maxTimerRequiringTestlet.id);
          let ok = true;
          allUnitsSequenceIdsToCheck.forEach(u => {
            if (!this.tcs.hasUnitDefinition(u)) {
              ok = false;
            }
          });
          if (ok) {
            return of(true);
          } else {
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

        }
      } else {

        // 2 going backwards --> no check, because units are loaded in ascending order

        return of(true);
      }
    }
  }


  checkAndSolve_maxTime(newUnit: UnitControllerData): Observable<Boolean> {
    if (newUnit.maxTimerRequiringTestlet === null) {

      // 1 targetUnit is not in timed block \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

      if (this.tcs.currentMaxTimerTestletId) {

        // 1 a) leaving a timed block \\\\\\\\\\\\\\\\\\\\\\\\\\\\\

        const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
          width: '500px',
          // height: '300px',
          data:  <ConfirmDialogData>{
            title: this.cts.getCustomText('booklet_warningLeaveTimerBlockTitle'),
            content: this.cts.getCustomText('booklet_warningLeaveTimerBlockPrompt'),
            confirmbuttonlabel: 'Trotzdem weiter',
            confirmbuttonreturn: true,
            showcancel: true
          }
        });
        return dialogCDRef.afterClosed().pipe(
          switchMap(cdresult => {
              if ((typeof cdresult === 'undefined') || (cdresult === false)) {
                return of(false);
              } else {
                this.tcs.stopMaxTimer();

                return of(true);
              }
            }
        ));
      } else {

        // 1 b) no timers \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

        return of(true);
      }
    } else if (this.tcs.currentMaxTimerTestletId && (newUnit.maxTimerRequiringTestlet.id === this.tcs.currentMaxTimerTestletId)) {

      // 2 staying in timed block

      return of(true);

    } else {

      // 3 entering timed block

      if (this.tcs.currentMaxTimerTestletId && (newUnit.maxTimerRequiringTestlet.id !== this.tcs.currentMaxTimerTestletId)) {

        // 3 a) leaving a timed block \\\\\\\\\\\\\\\\\\\\\\\\\\\\\

        const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
          width: '500px',
          data:  <ConfirmDialogData>{
            title: this.cts.getCustomText('booklet_warningLeaveTimerBlockTitle'),
            content: this.cts.getCustomText('booklet_warningLeaveTimerBlockTextPrompt'),
            confirmbuttonlabel: 'Trotzdem weiter',
            confirmbuttonreturn: true,
            showcancel: true
          }
        });
        return dialogCDRef.afterClosed().pipe(
          switchMap(cdresult => {
              if ((typeof cdresult === 'undefined') || (cdresult === false)) {
                return of(false);
              } else {
                this.tcs.stopMaxTimer();
                this.tcs.rootTestlet.lockUnits_before(newUnit.maxTimerRequiringTestlet.id);
                this.tcs.startMaxTimer(newUnit.maxTimerRequiringTestlet.id, newUnit.maxTimerRequiringTestlet.maxTimeLeft);

                return of(true);
              }
            }
        ));
      } else {

        // 3 b) just entering timed block, no timed block before

        this.tcs.rootTestlet.lockUnits_before(newUnit.maxTimerRequiringTestlet.id);
        this.tcs.startMaxTimer(newUnit.maxTimerRequiringTestlet.id, newUnit.maxTimerRequiringTestlet.maxTimeLeft);

        return of(true);
      }
    }
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>|boolean {
    const targetUnitSequenceId: number = Number(next.params['u']);
    if (this.tcs.currentUnitSequenceId > 0) {
      this.tcs.updateMinMaxUnitSequenceId(this.tcs.currentUnitSequenceId);
    } else {
      this.tcs.updateMinMaxUnitSequenceId(targetUnitSequenceId);
    }
    let forceNavigation = false;
    const routerStateObject = this.router.getCurrentNavigation();
    if (routerStateObject.extras.state) {
      forceNavigation = routerStateObject.extras.state['force'];
    }

    let myreturn = false;
    if (this.tcs.rootTestlet === null) {
      console.warn('unit canActivate: true (rootTestlet null)');
      myreturn = false;
      const oldTestId = localStorage.getItem(TestControllerComponent.localStorageTestKey);
      if (oldTestId) {
        this.router.navigate([`/t/${oldTestId}`]);
      } else {
        this.router.navigate(['/']);
      }
    } else if ((targetUnitSequenceId < this.tcs.minUnitSequenceId) || (targetUnitSequenceId > this.tcs.maxUnitSequenceId)) {
      console.warn('unit canActivate: false (unit# out of range)');
      myreturn = false;
    } else {
      const newUnit: UnitControllerData = this.tcs.rootTestlet.getUnitAt(targetUnitSequenceId);
      if (!newUnit) {
        myreturn = false;
        console.warn('target unit null (targetUnitSequenceId: ' + targetUnitSequenceId.toString());
      } else if (newUnit.unitDef.locked) {
        myreturn = false;
        console.warn('unit canActivate: locked');
      } else if (newUnit.unitDef.canEnter === 'n') {
        myreturn = false;
        console.warn('unit canActivate: false (unit is locked)');
      } else {

        return this.checkAndSolve_PresentationCompleteCode(newUnit).pipe(
          switchMap(cAsPC => {
            if (!cAsPC) {
              return of(false);
            } else {
              return this.checkAndSolve_Code(newUnit, forceNavigation).pipe(
                switchMap(cAsC => {
                  if (!cAsC) {
                    return of(false);
                  } else {
                    return this.checkAndSolve_DefLoaded(newUnit).pipe(
                      switchMap(cAsDL => {
                        this.mds.setSpinnerOff();
                        if (!cAsDL) {
                          return of(false);
                        } else {
                            return this.checkAndSolve_maxTime(newUnit).pipe(
                              switchMap(cAsMT => {
                                if (!cAsMT) {
                                  return of(false);
                                } else {
                                  this.tcs.currentUnitSequenceId = targetUnitSequenceId;
                                  this.tcs.updateMinMaxUnitSequenceId(this.tcs.currentUnitSequenceId);
                                  this.tcs.addUnitLog(newUnit.unitDef.alias, LogEntryKey.UNITENTER);
                                  return of(true);
                                }
                              }));
                        }
                      }));
                }
              }));
          }
        }));


      }
    }

    return myreturn;
  }
}


@Injectable()
export class UnitDeactivateGuard implements CanDeactivate<UnithostComponent> {
  constructor(
    private tcs: TestControllerService
  ) {}

  canDeactivate(component: UnithostComponent, currentRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot)
      : Observable<boolean> | boolean {

    if (this.tcs.rootTestlet !== null) {
      const currentUnitSequenceId: number = Number(currentRoute.params['u']);
      const currentUnit: UnitControllerData = this.tcs.rootTestlet.getUnitAt(currentUnitSequenceId);

      this.tcs.addUnitLog(currentUnit.unitDef.alias, LogEntryKey.UNITTRYLEAVE);
    }
    return true;
  }
}

export const unitRouteGuards = [UnitActivateGuard, UnitDeactivateGuard];
