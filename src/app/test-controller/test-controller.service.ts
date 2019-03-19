import { debounceTime, takeUntil, map } from 'rxjs/operators';
import { BehaviorSubject, of, Observable, Subject, Subscription, interval, timer } from 'rxjs';
import { Injectable } from '@angular/core';
import { Testlet, BookletConfig, MaxTimerData } from './test-controller.classes';
import { LastStateKey, LogEntryKey, UnitRestorePointData, UnitResponseData,
    MaxTimerDataType, UnitNaviButtonData } from './test-controller.interfaces';
import { BackendService } from './backend.service';
import { ServerError } from '../backend.service';
import { KeyValuePair, KeyValuePairNumber } from '../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class TestControllerService {
  private standardBookletConfig: BookletConfig = {
    showMainNaviButtons: true
  };
  public bookletConfig$ = new BehaviorSubject<BookletConfig>(this.standardBookletConfig);
  public rootTestlet: Testlet = null;
  public bookletDbId = 0;
  public maxUnitSequenceId = 0;
  public minUnitSequenceId = 0;
  public loginname = '';
  public mode = '';

  public navigationRequest$ = new Subject<string>();
  public maxTimeTimer$ = new Subject<MaxTimerData>();
  public currentMaxTimerTestletId = '';
  private maxTimeIntervalSubscription: Subscription = null;

  private _currentUnitSequenceId: number;
  public currentUnitDbKey = '';
  public currentUnitTitle = '';
  public unitPrevEnabled$ = new BehaviorSubject<boolean>(false);
  public unitNextEnabled$ = new BehaviorSubject<boolean>(false);
  public unitListForNaviButtons$ = new BehaviorSubject<UnitNaviButtonData[]>([]);
  public navPolicyNextOnlyIfPresentationComplete = false;
  public showNavButtons = false;

  public get currentUnitSequenceId(): number {
    return this._currentUnitSequenceId;
  }
  public set currentUnitSequenceId(v: number) {
    this.unitPrevEnabled$.next(v > this.minUnitSequenceId);
    this.unitNextEnabled$.next(v < this.maxUnitSequenceId);
    if (this.rootTestlet && this.showNavButtons) {
      const myUnitListForNaviButtons: UnitNaviButtonData[] = [];
      for (let sequ = 1; sequ <= this.rootTestlet.getMaxSequenceId(); sequ++) {
        const myUnitData = this.rootTestlet.getUnitAt(sequ);
        if (myUnitData) {
          const disabled = (sequ < this.minUnitSequenceId) || (sequ > this.maxUnitSequenceId) || myUnitData.unitDef.locked;
          myUnitListForNaviButtons.push({
            sequenceId: sequ,
            label: myUnitData.unitDef.naviButtonLabel, //  myUnitData.unitDef.naviButtonLabel,disabled ? '' :
            disabled: disabled,
            isCurrent: sequ === v
          });
        }
      }
      this.unitListForNaviButtons$.next(myUnitListForNaviButtons);
    }
    this._currentUnitSequenceId = v;
  }

  public LastMaxTimerState: KeyValuePairNumber = {};
   // ))))))))))))))))))))))))))))))))))))))))))))))))

  private players: {[filename: string]: string} = {};
  private unitDefinitions: {[sequenceId: number]: string} = {};
  private unitRestorePoints: {[sequenceId: number]: string} = {};
  private unitPresentationCompleteStates: {[sequenceId: number]: string} = {};

  private restorePointsToSave$ = new Subject<UnitRestorePointData>();
  private responsesToSave$ = new Subject<UnitResponseData>();

  constructor (
    private bs: BackendService
  ) {
    this.restorePointsToSave$.pipe(
      debounceTime(200)).subscribe(restorePoint => {
        this.bs.newUnitRestorePoint(this.bookletDbId, restorePoint.unitDbKey, Date.now(),
              JSON.stringify(restorePoint.restorePoint)).subscribe(ok => {
          if (ok instanceof ServerError) {
            console.log('((((((((((((((((newUnitRestorePoint');
          }
        });
      }
    );

    // -- -- -- -- -- -- -- -- -- -- -- -- -- --
    this.responsesToSave$.pipe(
      debounceTime(200)).subscribe(response => {
        this.bs.newUnitResponse(this.bookletDbId, Date.now(), response.unitDbKey,
              JSON.stringify(response.response), response.responseType).subscribe(ok => {
          if (ok instanceof ServerError) {
            console.log('((((((((((((((((newUnitResponse');
          }
        });
      }
    );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  public resetDataStore() {
    this.bookletConfig$.next(this.standardBookletConfig);
    this.bookletDbId = 0;
    this.players = {};
    this.unitDefinitions = {};
    this.unitRestorePoints = {};
    this.rootTestlet = null;
    this.maxUnitSequenceId = 0;
    this.mode = '';
    this.loginname = '';
    this.currentUnitSequenceId = 0;
    this.currentUnitDbKey = '';
    this.currentUnitTitle = '';
    this.unitPrevEnabled$.next(false);
    this.unitNextEnabled$.next(false);
    if (this.maxTimeIntervalSubscription !== null) {
      this.maxTimeIntervalSubscription.unsubscribe();
      this.maxTimeIntervalSubscription = null;
    }
    this.currentMaxTimerTestletId = '';
    this.LastMaxTimerState = {};
    this.unitListForNaviButtons$.next([]);
    this.navPolicyNextOnlyIfPresentationComplete = false;
    this.showNavButtons = false;
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  // uppercase and add extension if not part
  public normaliseId(s: string, standardext = ''): string {
    s = s.trim().toUpperCase();
    s.replace(/\s/g, '_');
    if (standardext.length > 0) {
      standardext = standardext.trim().toUpperCase();
      standardext.replace(/\s/g, '_');
      standardext = '.' + standardext.replace('.', '');

      if (s.slice(-(standardext.length)) !== standardext) {
        s = s + standardext;
      }
    }
    return s;
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  public addPlayer (id: string, player: string) {
    this.players[this.normaliseId(id, 'html')] = player;
  }
  public hasPlayer (id: string): boolean {
    return this.players.hasOwnProperty(this.normaliseId(id, 'html'));
  }
  public getPlayer(id: string): string {
    return this.players[this.normaliseId(id, 'html')];
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  public addUnitDefinition (sequenceId: number, uDef: string) {
    this.unitDefinitions[sequenceId] = uDef;
  }
  public hasUnitDefinition (sequenceId: number): boolean {
    return this.unitDefinitions.hasOwnProperty(sequenceId);
  }
  public getUnitDefinition(sequenceId: number): string {
    return this.unitDefinitions[sequenceId];
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  // adding RestorePoint via newUnitRestorePoint below
  public hasUnitRestorePoint (sequenceId: number): boolean {
    return this.unitRestorePoints.hasOwnProperty(sequenceId);
  }
  public getUnitRestorePoint(sequenceId: number): string {
    return this.unitRestorePoints[sequenceId];
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  // adding PresentationComplete via newUnitStatePresentationComplete below
  public addUnitPresentationComplete (sequenceId: number, uPC: string) {
    this.unitPresentationCompleteStates[sequenceId] = uPC;
  }
  public hasUnitPresentationComplete (sequenceId: number): boolean {
    return this.unitPresentationCompleteStates.hasOwnProperty(sequenceId);
  }
  public getUnitPresentationComplete(sequenceId: number): string {
    return this.unitPresentationCompleteStates[sequenceId];
  }


  // 7777777777777777777777777777777777777777777777777777777777777777777777
  public setUnitNavigationRequest(RequestKey: string) {
    this.navigationRequest$.next(RequestKey);
  }


  // 7777777777777777777777777777777777777777777777777777777777777777777777
  public addBookletLog(logKey: LogEntryKey, entry = '') {
    if (this.mode !== 'review') {
      this.bs.addBookletLog(this.bookletDbId, Date.now(),
            entry.length > 0 ? logKey + ': ' + JSON.stringify(entry) : logKey).subscribe(ok => {
        if (ok instanceof ServerError) {
          console.log('((((((((((((((((addBookletLog');
        }
      });
    }
  }
  public setBookletState(stateKey: LastStateKey, state: string) {
    if (this.mode !== 'review') {
      this.bs.setBookletState(this.bookletDbId, stateKey, state).subscribe(ok => {
        if (ok instanceof ServerError) {
          console.log('((((((((((((((((setBookletState');
        }
      });
    }
  }
  public addUnitLog(unitDbKey: string, logKey: LogEntryKey, entry = '') {
    if (this.mode !== 'review') {
      this.bs.addUnitLog(this.bookletDbId, Date.now(), unitDbKey,
            entry.length > 0 ? logKey + ': ' + JSON.stringify(entry) : logKey).subscribe(ok => {
        if (ok instanceof ServerError) {
          console.log('((((((((((((((((addUnitLog');
        }
      });
    }
  }
  public newUnitResponse(unitDbKey: string, response: string, responseType: string) {
    if (this.mode !== 'review') {
      this.responsesToSave$.next({
        unitDbKey: unitDbKey,
        response: response,
        responseType: responseType
      });
    }
  }
  public newUnitRestorePoint(unitDbKey: string, unitSequenceId: number, restorePoint: string, postToServer: boolean) {
    this.unitRestorePoints[unitSequenceId] = restorePoint;
    if (postToServer && this.mode !== 'review') {
      this.restorePointsToSave$.next({
        unitDbKey: unitDbKey,
        restorePoint: restorePoint
      });
    }
  }
  public newUnitStatePresentationComplete(unitDbKey: string, unitSequenceId: number, presentationComplete: string) {
    this.unitPresentationCompleteStates[unitSequenceId] = presentationComplete;
    if (this.mode !== 'review') {
      this.addUnitLog(unitDbKey, LogEntryKey.PRESENTATIONCOMPLETE, presentationComplete);
      this.bs.setUnitState(unitDbKey, LastStateKey.PRESENTATIONCOMPLETE, presentationComplete).subscribe(ok => {
        if (ok instanceof ServerError) {
          console.log('((((((((((((((((setUnitState');
        }
      });
    }
  }
  public newUnitStateResponsesGiven(unitDbKey: string, unitSequenceId: number, responsesGiven: string) {
    if (this.mode !== 'review') {
      this.addUnitLog(unitDbKey, LogEntryKey.RESPONSESCOMPLETE, responsesGiven);
    }
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  public startMaxTimer(testletId: string, timeLeftMinutes: number) {
    if (this.maxTimeIntervalSubscription !== null) {
      this.maxTimeIntervalSubscription.unsubscribe();
    }
    this.maxTimeTimer$.next(new MaxTimerData(timeLeftMinutes, testletId, MaxTimerDataType.STARTED));
    this.currentMaxTimerTestletId = testletId;
    this.maxTimeIntervalSubscription = interval(1000)
      .pipe(
        takeUntil(
          timer(timeLeftMinutes * 60 * 1000)
        ),
        map(val => (timeLeftMinutes * 60) - val - 1)
      ).subscribe(
        val => {
          this.maxTimeTimer$.next(new MaxTimerData(val / 60, testletId, MaxTimerDataType.STEP));
        },
        e => console.log('maxTime onError: %s', e),
        () => {
          this.maxTimeTimer$.next(new MaxTimerData(0, testletId, MaxTimerDataType.ENDED));
          this.currentMaxTimerTestletId = '';
        }
      );
  }

  public stopMaxTimer() {
    if (this.maxTimeIntervalSubscription !== null) {
      this.maxTimeIntervalSubscription.unsubscribe();
      this.maxTimeIntervalSubscription = null;
      this.maxTimeTimer$.next(new MaxTimerData(0, this.currentMaxTimerTestletId, MaxTimerDataType.CANCELLED));
    }
    this.currentMaxTimerTestletId = '';
  }

  public updateMinMaxUnitSequenceId(startWith: number) {
    if (this.rootTestlet) {
      this.minUnitSequenceId = this.rootTestlet.getFirstUnlockedUnitSequenceId(startWith);
      this.maxUnitSequenceId = this.rootTestlet.getLastUnlockedUnitSequenceId(startWith);
      console.log('updateMinMaxUnitSequenceId: ' + this.minUnitSequenceId.toString() + '/' + this.maxUnitSequenceId.toString());
    }
  }
}
