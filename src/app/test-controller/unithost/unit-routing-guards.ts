import { StartLockInputComponent } from '../start-lock-input/start-lock-input.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../iqb-common/confirm-dialog/confirm-dialog.component';
import { MatDialog, MatSnackBar } from '@angular/material';
import { TestControllerService } from '../test-controller.service';
import { switchMap, map } from 'rxjs/operators';
import { UnithostComponent } from './unithost.component';
import { Injectable } from '@angular/core';
import { CanActivate, CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { UnitControllerData } from '../test-controller.classes';
import { CodeInputData, LogEntryKey, StartLockData } from '../test-controller.interfaces';
import { MainDataService } from 'src/app/maindata.service';

@Injectable()
export class UnitActivateGuard implements CanActivate {
  constructor(
    private tcs: TestControllerService,
    private mds: MainDataService,
    public startLockDialog: MatDialog,
    public confirmDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  private getCostumText(key: string): string {
    const value = this.tcs.getCostumText(key);
    if (value.length > 0) {
      return value;
    } else {
      return this.mds.getCostumText(key);
    }
  }

  // ****************************************************************************************
  checkAndSolve_PresentationCompleteCode(newUnit: UnitControllerData): Observable<Boolean> {
    let checkPC = this.tcs.navPolicyNextOnlyIfPresentationComplete && this.tcs.currentUnitSequenceId > 0;
    if (checkPC) {
      // only check if target unit sequenceIf higher then current
      checkPC = this.tcs.currentUnitSequenceId < newUnit.unitDef.sequenceId;
    }
    if (checkPC) {
      let myreturn = true;
      let checkUnitSequenceId = newUnit.unitDef.sequenceId - 1;
      while (myreturn && (checkUnitSequenceId >= this.tcs.currentUnitSequenceId)) {
        if (this.tcs.hasUnitPresentationComplete(checkUnitSequenceId)) {
          if (this.tcs.getUnitPresentationComplete(checkUnitSequenceId) !== 'yes') {
            myreturn = false;
          }
        } else {
          myreturn = false;
        }
        checkUnitSequenceId -= 1;
      }
      if (myreturn) {
        return of(true);
      } else {
        if (this.tcs.mode === 'hot') {
          const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
            width: '500px',
            // height: '300px',
            data:  <ConfirmDialogData>{
              title: this.getCostumText('booklet_msgPresentationNotCompleteTitle'),
              content: this.getCostumText('booklet_msgPresentationNotCompleteText'),
              confirmbuttonlabel: 'OK',
              confirmbuttonreturn: false,
              showcancel: false
            }
          });
          return dialogCDRef.afterClosed().pipe(map(ok => false));
        } else {
          this.snackBar.open('Im Hot-Modus dürfte hier nicht weitergeblättert werden (PresentationNotComplete).',
              'Weiterblättern', {duration: 3000});
          return of(true);
        }
      }
    } else {
      return of(true);
    }
  }

  // ****************************************************************************************
  checkAndSolve_Code(newUnit: UnitControllerData): Observable<Boolean> {
    if (newUnit.codeRequiringTestlets) {
      if (newUnit.codeRequiringTestlets.length > 0) {
        const myCodes: CodeInputData[] = [];
        newUnit.codeRequiringTestlets.forEach(t => {
          myCodes.push(<CodeInputData>{
            testletId: t.id,
            prompt: t.codePrompt,
            code: t.codeToEnter.toUpperCase().trim(),
            value: this.tcs.mode === 'hot' ? '' : t.codeToEnter
          });
        });

        const dialogRef = this.startLockDialog.open(StartLockInputComponent, {
          width: '500px',
          autoFocus: true,
          data: <StartLockData>{
            title: this.getCostumText('booklet_codeToEnterTitle'),
            prompt: this.getCostumText('booklet_codeToEnterPrompt'),
            codes: myCodes
          }
        });
        return dialogRef.afterClosed().pipe(
          switchMap(result => {
              if (result === false) {
                return of(false);
              } else {
                const codeData = result as CodeInputData[];
                let codesOk = true;
                console.log(codeData);
                for (const c of codeData) {
                  if (c.value.toUpperCase().trim() !== c.code) {
                    codesOk = false;
                    break;
                  }
                }
                if (codesOk) {
                  newUnit.codeRequiringTestlets.forEach(t => {
                    t.codeToEnter = '';
                  });

                  return of(true);

                } else {
                  this.snackBar.open('Die Eingabe war nicht korrekt.', this.getCostumText('booklet_codeToEnterTitle'), {duration: 3000});
                  return of(false);
                }
              }
            }
        ));
      } else {
        return of(true);
      }
    } else {
      return of(true);
    }
  }


  // ****************************************************************************************
  checkAndSolve_maxTime(newUnit: UnitControllerData): Observable<Boolean> {
    if (newUnit.maxTimerRequiringTestlet === null) {

      // 1 targetUnit is not in timed block \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

      if (this.tcs.currentMaxTimerTestletId) {

        // 1 a) leaving a timed block \\\\\\\\\\\\\\\\\\\\\\\\\\\\\

        const dialogCDRef = this.confirmDialog.open(ConfirmDialogComponent, {
          width: '500px',
          // height: '300px',
          data:  <ConfirmDialogData>{
            title: this.getCostumText('booklet_warningLeaveTimerBlockTitle'),
            content: this.getCostumText('booklet_warningLeaveTimerBlockPrompt'),
            confirmbuttonlabel: 'Trotzdem weiter',
            confirmbuttonreturn: true,
            showcancel: true
          }
        });
        return dialogCDRef.afterClosed().pipe(
          switchMap(cdresult => {
              if (cdresult === false) {
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
            title: this.getCostumText('booklet_warningLeaveTimerBlockTitle'),
            content: this.getCostumText('booklet_warningLeaveTimerBlockTextPrompt'),
            confirmbuttonlabel: 'Trotzdem weiter',
            confirmbuttonreturn: true,
            showcancel: true
          }
        });
        return dialogCDRef.afterClosed().pipe(
          switchMap(cdresult => {
              if (cdresult === false) {
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

  // ****************************************************************************************
  // ****************************************************************************************
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    const targetUnitSequenceId: number = Number(next.params['u']);
    if (this.tcs.currentUnitSequenceId > 0) {
      this.tcs.updateMinMaxUnitSequenceId(this.tcs.currentUnitSequenceId);
    } else {
      this.tcs.updateMinMaxUnitSequenceId(targetUnitSequenceId);
    }


    let myreturn = false;
    if (this.tcs.rootTestlet === null) {
      console.log('unit canActivate: true (rootTestlet null)');
      myreturn = true; // ??
    } else if ((targetUnitSequenceId < this.tcs.minUnitSequenceId) || (targetUnitSequenceId > this.tcs.maxUnitSequenceId)) {
      console.log('unit canActivate: false (unit# out of range)');
      myreturn = false;
    } else {
      const newUnit: UnitControllerData = this.tcs.rootTestlet.getUnitAt(targetUnitSequenceId);
      if (newUnit.unitDef.locked) {
        myreturn = false;
        console.log('unit canActivate: locked');
      } else if (newUnit.unitDef.canEnter === 'n') {
        myreturn = false;
        console.log('unit canActivate: false (unit is locked)');
      } else {
        // %%%%%%%%%%%%%%%%%%%%%%%%%%

        return this.checkAndSolve_PresentationCompleteCode(newUnit).pipe(
          switchMap(cAsPC => {
            if (!cAsPC) {
              return of(false);
            } else {
              return this.checkAndSolve_Code(newUnit).pipe(
                switchMap(cAsC => {
                  if (!cAsC) {
                    return of(false);
                  } else {
                    return this.checkAndSolve_maxTime(newUnit).pipe(
                      switchMap(cAsMT => {
                        if (!cAsMT) {
                          return of(false);
                        } else {
                          this.tcs.currentUnitSequenceId = targetUnitSequenceId;
                          this.tcs.updateMinMaxUnitSequenceId(this.tcs.currentUnitSequenceId);
                          this.tcs.addUnitLog(newUnit.unitDef.id, LogEntryKey.UNITENTER);
                          return of(true);
                        }
                      }));
                  }
                }));
          }
        }));

        // %%%%%%%%%%%%%%%%%%%%%%%%%%
      }
    }

    return myreturn;
  }
}

// 777777777777777777777777777777777777777777777777777777777777777777777777777777777
@Injectable()
export class UnitDeactivateGuard implements CanDeactivate<UnithostComponent> {
  constructor(
    private tcs: TestControllerService,
    public confirmDialog: MatDialog
  ) {}

  canDeactivate(
    component: UnithostComponent,
    currentRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    if (this.tcs.rootTestlet !== null) {
      const currentUnitSequenceId: number = Number(currentRoute.params['u']);
      const currentUnit: UnitControllerData = this.tcs.rootTestlet.getUnitAt(currentUnitSequenceId);

      this.tcs.addUnitLog(currentUnit.unitDef.id, LogEntryKey.UNITLEAVE);
    }
    return true;
  }
}

// 777777777777777777777777777777777777777777777777777777777777777777777777777777777
export const unitRoutingGuards = [UnitActivateGuard, UnitDeactivateGuard];
