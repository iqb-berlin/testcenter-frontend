import { debounceTime, takeUntil, map } from 'rxjs/operators';
import { BehaviorSubject, Subject, Subscription, interval, timer } from 'rxjs';
import { Injectable } from '@angular/core';
import { Testlet, BookletConfig, MaxTimerData } from './test-controller.classes';
import {
  LastStateKey, LogEntryKey, UnitRestorePointData, UnitResponseData,
  MaxTimerDataType, UnitNaviButtonData, KeyValuePairNumber, NoUnitFlag
} from './test-controller.interfaces';
import { BackendService } from './backend.service';
import {Router} from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class TestControllerService {
  public testId = '';

  private standardBookletConfig: BookletConfig = {
    showMainNaviButtons: true
  };
  public bookletConfig$ = new BehaviorSubject<BookletConfig>(this.standardBookletConfig);
  public rootTestlet: Testlet = null;
  public maxUnitSequenceId = 0;
  public minUnitSequenceId = 0;
  public mode = '';
  public logging = true;
  public lazyloading = true;
  public dataLoading = false;
  public bookletLoadComplete = false;

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
  public navButtons = false;
  public navArrows = true;
  public pageNav = true;

  public get currentUnitSequenceId(): number {
    return this._currentUnitSequenceId;
  }
  public set currentUnitSequenceId(v: number) {
    this.unitPrevEnabled$.next(v > this.minUnitSequenceId);
    this.unitNextEnabled$.next(v < this.maxUnitSequenceId);
    if (this.rootTestlet && this.navButtons) {
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
    private router: Router,
    private bs: BackendService
  ) {
    this.restorePointsToSave$.pipe(
      debounceTime(200)).subscribe(restorePoint => {
        this.bs.newUnitRestorePoint(this.testId, restorePoint.unitDbKey, Date.now(),
              JSON.stringify(restorePoint.restorePoint)).subscribe(ok => {
          if (!ok) {
            console.warn('newUnitRestorePoint failed');
          }
        });
      }
    );

    // -- -- -- -- -- -- -- -- -- -- -- -- -- --
    this.responsesToSave$.pipe(
      debounceTime(200)).subscribe(response => {
        this.bs.newUnitResponse(this.testId, Date.now(), response.unitDbKey,
              JSON.stringify(response.response), response.responseType).subscribe(ok => {
          if (!ok) {
            console.warn('newUnitResponse failed');
          }
        });
      }
    );
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  public resetDataStore() {
    this.bookletConfig$.next(this.standardBookletConfig);
    this.players = {};
    this.unitDefinitions = {};
    this.unitRestorePoints = {};
    this.rootTestlet = null;
    this.maxUnitSequenceId = 0;
    this.mode = '';
    this.logging = true;
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
    this.navButtons = false;
    this.navArrows = true;
    this.pageNav = true;
    this.lazyloading = true;
    this.dataLoading = false;
    this.bookletLoadComplete = false;
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
  public addBookletLog(logKey: LogEntryKey, entry = '') {
    if ((this.mode !== 'run-review') && this.logging) {

      const entryData =  entry.length > 0 ? logKey + ': ' + JSON.stringify(entry) : logKey;
      this.bs.addBookletLog(this.testId, Date.now(), entryData).subscribe(ok => {
        if (!ok) {
          console.warn('addBookletLog failed');
        }
      });
    }
  }
  public setBookletState(stateKey: LastStateKey, state: string) {
    if (this.mode !== 'run-review') {
      this.bs.setBookletState(this.testId, stateKey, state).subscribe(ok => {
        if (!ok) {
          console.warn('setBookletState failed');
        }
      });
    }
  }
  public addUnitLog(unitDbKey: string, logKey: LogEntryKey, entry = '') {
    if ((this.mode !== 'run-review') && this.logging) {
      this.bs.addUnitLog(this.testId, Date.now(), unitDbKey,
            entry.length > 0 ? logKey + ': ' + JSON.stringify(entry) : logKey).subscribe(ok => {
        if (!ok) {
          console.warn('addUnitLog failed');
        }
      });
    }
  }
  public newUnitResponse(unitDbKey: string, response: string, responseType: string) {
    if (this.mode !== 'run-review') {
      this.responsesToSave$.next({
        unitDbKey: unitDbKey,
        response: response,
        responseType: responseType
      });
    }
  }
  public newUnitRestorePoint(unitDbKey: string, unitSequenceId: number, restorePoint: string, postToServer: boolean) {
    this.unitRestorePoints[unitSequenceId] = restorePoint;
    if (postToServer && this.mode !== 'run-review') {
      this.restorePointsToSave$.next({
        unitDbKey: unitDbKey,
        restorePoint: restorePoint
      });
    }
  }
  public newUnitStatePresentationComplete(unitDbKey: string, unitSequenceId: number, presentationComplete: string) {
    this.unitPresentationCompleteStates[unitSequenceId] = presentationComplete;
    if (this.mode !== 'run-review') {
      this.addUnitLog(unitDbKey, LogEntryKey.PRESENTATIONCOMPLETE, presentationComplete);
      this.bs.setUnitState(this.testId, unitDbKey, LastStateKey.PRESENTATIONCOMPLETE, presentationComplete).subscribe(ok => {
        if (!ok) {
          console.warn('setUnitState failed');
        }
      });
    }
  }
  public newUnitStateResponsesGiven(unitDbKey: string, unitSequenceId: number, responsesGiven: string) {
    if (this.mode !== 'run-review') {
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
    }
  }

  public setUnitNavigationRequest(navString: string) {
    if (!this.rootTestlet) {
      console.warn(`TestControllerService.setUnitNavigationRequest: Kein Testheft für "${navString}" verfügbar.`);
    } else {
      if (!navString) {
        navString = '#next';
      }
      switch (navString) {
        case '#next':
          let startWith = this.currentUnitSequenceId;
          if (startWith < this.minUnitSequenceId) {
            startWith = this.minUnitSequenceId - 1;
          }
          const nextUnitSequenceId = this.rootTestlet.getNextUnlockedUnitSequenceId(startWith);
          if (nextUnitSequenceId > 0) {
            this.router.navigateByUrl(`/t/${this.testId}/u/${nextUnitSequenceId}`);
          }
          break;
        case '#previous':
          this.router.navigateByUrl(`/t/${this.testId}/u/${this.currentUnitSequenceId - 1}`);
          break;
        case '#first':
          this.router.navigateByUrl(`/t/${this.testId}/u/${this.minUnitSequenceId}`);
          break;
        case '#last':
          this.router.navigateByUrl(`/t/${this.testId}/u/${this.maxUnitSequenceId}`);
          break;
        case '#end':
          // this.mds.endBooklet(); TODO add some old code to end properly
          this.router.navigateByUrl(`/t/${this.testId}/nu/${NoUnitFlag.END}`);
          break;

        default:
          this.router.navigateByUrl(`/t/${this.testId}/u/${navString}`);
          break;
      }
    }
  }
}
