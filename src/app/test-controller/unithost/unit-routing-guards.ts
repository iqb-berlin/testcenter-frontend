import { FormGroup } from '@angular/forms';
import { StartLockInputComponent } from '../start-lock-input/start-lock-input.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../iqb-common/confirm-dialog/confirm-dialog.component';
import { MatDialog, MatSnackBar } from '@angular/material';
import { TestControllerService } from '../test-controller.service';
import { switchMap } from 'rxjs/operators';
import { UnithostComponent } from './unithost.component';
import { Injectable } from '@angular/core';
import { CanActivate, CanDeactivate, ActivatedRouteSnapshot, RouterStateSnapshot, Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';
import { UnitDef, UnitControllerData } from '../test-controller.classes';
import { CodeInputData, LogEntryKey, StartLockData } from '../test-controller.interfaces';

@Injectable()
export class UnitActivateGuard implements CanActivate {
  constructor(
    private tcs: TestControllerService,
    public startLockDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    const targetUnitSequenceId: number = Number(next.params['u']);
    // const currentBooklet = this.tcs.booklet$.getValue();

    let myreturn = false;
    if (this.tcs.rootTestlet === null) {
      console.log('unit canActivate: true (rootTestlet null)');
      myreturn = true; // ??
    } else if ((targetUnitSequenceId < 1) || (this.tcs.numberOfUnits < targetUnitSequenceId)) {
      console.log('unit canActivate: false (unit# out of range)');
      myreturn = false;
    } else {
      const newUnit: UnitControllerData = this.tcs.rootTestlet.getUnitAt(targetUnitSequenceId);
      if (newUnit.unitDef.canEnter === 'n') {
        myreturn = false;
        console.log('unit canActivate: false (unit is locked)');
      // } else if (!this.bs.isItemplayerReady(newUnit.unitDefinitionType)) {
      //   console.log('itemplayer for unit not available');
      } else if (newUnit.codeRequiringTestlets.length > 0) {
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
          data: <StartLockData>{
            title: 'Freigabecodes',
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
                for (const c of codeData) {
                  if (c.value.toUpperCase().trim() !== c.code) {
                    codesOk = false;
                    break;
                  }
                }
                if (codesOk) {
                  // ?? this.tcs.setCurrentUnit(targetUnitSequenceId);
                  newUnit.codeRequiringTestlets.forEach(t => {
                    t.codeToEnter = '';
                  });
                  this.tcs.addUnitLog(newUnit.unitDef.id, LogEntryKey.UNITENTER);

                  return of(true);
                } else {
                  this.snackBar.open('Die Eingabe war nicht korrekt.', 'Freigabewort', {duration: 3000});
                  return of(false);
                }
              }
            }
        ));
      } else {
        this.tcs.currentUnitSequenceId = targetUnitSequenceId;
        this.tcs.addUnitLog(newUnit.unitDef.id, LogEntryKey.UNITENTER);

        myreturn = true;
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

    // if (this.tcs.rootTestlet !== null) {
    //   // const currentUnitPos = this.tcs.currentUnitPos$.getValue();
    //   const currentUnit = currentBooklet.getUnitAt(currentUnitPos);
    //   if (currentUnit !== null) {
    //     if (component.leaveWarning) {

    //       const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
    //         width: '500px',
    //         height: '300px',
    //         data:  <ConfirmDialogData>{
    //           title: 'Aufgabe verlassen?',
    //           content: component.leaveWarningText,
    //           confirmbuttonlabel: 'Weiterblättern',
    //           confirmbuttonreturn: true
    //         }
    //       });
    //       return dialogRef.afterClosed().pipe(
    //         switchMap(result => {
    //             if (result === false) {
    //               return of(false);
    //             } else {
    //               return of(true);
    //             }
    //           }
    //       ));
    //     }
    //   }
    // }
    return true;
  }
}

// 777777777777777777777777777777777777777777777777777777777777777777777777777777777
export const unitRoutingGuards = [UnitActivateGuard, UnitDeactivateGuard];
