import { LogindataService } from './../../logindata.service';
import { FormGroup } from '@angular/forms';
import { StartLockInputComponent } from './../start-lock-input/start-lock-input.component';
import { ConfirmDialogComponent, ConfirmDialogData } from './../../iqb-common/confirm-dialog/confirm-dialog.component';
import { MatDialog, MatSnackBar } from '@angular/material';
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
    private lds: LogindataService,
    private tcs: TestControllerService,
    public startLockDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    const targetUnitSequenceId: number = +next.params['u'];
    const currentBooklet = this.tcs.booklet$.getValue();

    let myreturn = false;
    if (currentBooklet === null) {
      console.log('unit canActivate: true (booklet null)');
      myreturn = true;
    } else if ((targetUnitSequenceId < 0) || (currentBooklet.units.length < targetUnitSequenceId - 1)) {
      console.log('unit canActivate: false (unit# out of range)');
      myreturn = false;
    } else {
      const newUnit = currentBooklet.getUnitAt(targetUnitSequenceId);
      if (newUnit.locked) {
        myreturn = false;
        console.log('unit canActivate: false (unit is locked)');
      // } else if (!this.bs.isItemplayerReady(newUnit.unitDefinitionType)) {
      //   console.log('itemplayer for unit not available');
      } else if (newUnit.startLockKey.length > 0) {
        const dialogRef = this.startLockDialog.open(StartLockInputComponent, {
          width: '500px',
          height: '300px',
          data: {
            prompt: newUnit.startLockPrompt,
            keyPreset: this.lds.loginMode$.getValue() === 'review' ? newUnit.startLockKey : ''
          }
        });
        return dialogRef.afterClosed().pipe(
          switchMap(result => {
              if (result === false) {
                return of(false);
              } else {
                const key = (<FormGroup>result).get('key').value.toUpperCase();
                if (key === newUnit.startLockKey) {
                  this.tcs.setCurrentUnit(targetUnitSequenceId);
                  currentBooklet.forgetStartLock(key);
                  return of(true);
                } else {
                  this.snackBar.open('Die Eingabe war nicht korrekt.', 'Freigabewort', {duration: 3000});
                  return of(false);
                }
              }
            }
        ));
      } else {
        this.tcs.setCurrentUnit(targetUnitSequenceId);
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
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    const currentBooklet = this.tcs.booklet$.getValue();
    if (currentBooklet !== null) {
      const currentUnitPos = this.tcs.currentUnitPos$.getValue();
      const currentUnit = currentBooklet.getUnitAt(currentUnitPos);
      if (currentUnit !== null) {
        if (component.leaveWarning) {

          const dialogRef = this.confirmDialog.open(ConfirmDialogComponent, {
            width: '500px',
            height: '300px',
            data:  <ConfirmDialogData>{
              title: 'Aufgabe verlassen?',
              content: component.leaveWarningText,
              confirmbuttonlabel: 'Weiterblättern',
              confirmbuttonreturn: true
            }
          });
          return dialogRef.afterClosed().pipe(
            switchMap(result => {
                if (result === false) {
                  return of(false);
                } else {
                  return of(true);
                }
              }
          ));
        }
      }
    }
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
