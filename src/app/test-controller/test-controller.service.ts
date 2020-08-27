import {debounceTime, map, takeUntil} from 'rxjs/operators';
import {BehaviorSubject, interval, Subject, Subscription, timer} from 'rxjs';
import {Injectable} from '@angular/core';
import {MaxTimerData, Testlet} from './test-controller.classes';
import {
  KeyValuePairNumber,
  LastStateKey,
  LogEntryKey,
  MaxTimerDataType,
  TestStatus,
  UnitNaviButtonData,
  UnitNavigationTarget,
  UnitStateData, WindowFocusState
} from './test-controller.interfaces';
import {BackendService} from './backend.service';
import {Router} from '@angular/router';
import {TestMode} from '../config/test-mode';
import {BookletConfig} from '../config/booklet-config';

@Injectable({
  providedIn: 'root'
})
export class TestControllerService {
  public testId = '';
  public testStatus$ = new BehaviorSubject<TestStatus>(TestStatus.WAITING_LOAD_START);
  public testStatusEnum = TestStatus;
  public loadComplete = false;
  public loadProgressValue = 0;

  public testMode = new TestMode();
  public bookletConfig = new BookletConfig();
  public rootTestlet: Testlet = null;
  public maxUnitSequenceId = 0;
  public minUnitSequenceId = 0;

  public maxTimeTimer$ = new Subject<MaxTimerData>();
  public currentMaxTimerTestletId = '';
  private maxTimeIntervalSubscription: Subscription = null;

  private _currentUnitSequenceId: number;
  public currentUnitDbKey = '';
  public currentUnitTitle = '';
  public unitPrevEnabled = false;
  public unitNextEnabled = false;
  public unitListForNaviButtons: UnitNaviButtonData[] = [];

  public get currentUnitSequenceId(): number {
    return this._currentUnitSequenceId;
  }

  public set currentUnitSequenceId(v: number) {
    this.unitPrevEnabled = v > this.minUnitSequenceId;
    this.unitNextEnabled = v < this.maxUnitSequenceId;
    if (this.rootTestlet && (this.bookletConfig.unit_navibuttons !== 'OFF') ) {
      const myUnitListForNaviButtons: UnitNaviButtonData[] = [];
      for (let sequ = 1; sequ <= this.rootTestlet.getMaxSequenceId(); sequ++) {
        const myUnitData = this.rootTestlet.getUnitAt(sequ);
        if (myUnitData) {
          const disabled = (sequ < this.minUnitSequenceId) || (sequ > this.maxUnitSequenceId) || myUnitData.unitDef.locked;
          myUnitListForNaviButtons.push({
            sequenceId: sequ,
            shortLabel: myUnitData.unitDef.naviButtonLabel,
            longLabel: myUnitData.unitDef.title,
            testletLabel: myUnitData.testletLabel,
            disabled: disabled,
            isCurrent: sequ === v
          });
        }
      }
      this.unitListForNaviButtons = myUnitListForNaviButtons;
    }
    this._currentUnitSequenceId = v;
  }

  public LastMaxTimerState: KeyValuePairNumber = {};

  private players: {[filename: string]: string} = {};
  private unitDefinitions: {[sequenceId: number]: string} = {};
  private unitStateDataParts: {[sequenceId: number]: string} = {};
  private unitPresentationCompleteStates: {[sequenceId: number]: string} = {};

  private unitStateDataToSave$ = new Subject<UnitStateData>();
  public windowFocusState$ = new Subject<WindowFocusState>();

  constructor (
    private router: Router,
    private bs: BackendService
  ) {
    this.unitStateDataToSave$.pipe(
      debounceTime(200)).subscribe(unitStateData => {
        this.bs.newUnitStateData(this.testId, Date.now(), unitStateData.unitDbKey,
              JSON.stringify(unitStateData.dataPartsAllString), unitStateData.unitStateDataType).subscribe(ok => {
          if (!ok) {
            console.warn('newUnitRestorePoint failed');
          }
        });
      }
    );
  }

  public resetDataStore() {
    this.players = {};
    this.unitDefinitions = {};
    this.unitStateDataParts = {};
    this.rootTestlet = null;
    this.maxUnitSequenceId = 0;
    this.currentUnitSequenceId = 0;
    this.currentUnitDbKey = '';
    this.currentUnitTitle = '';
    this.unitPrevEnabled = false;
    this.unitNextEnabled = false;
    if (this.maxTimeIntervalSubscription !== null) {
      this.maxTimeIntervalSubscription.unsubscribe();
      this.maxTimeIntervalSubscription = null;
    }
    this.currentMaxTimerTestletId = '';
    this.LastMaxTimerState = {};
    this.unitListForNaviButtons = [];
    // this.dataLoading = false; TODO set test status?
    // this.bookletLoadComplete = false;
  }


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

  public addPlayer (id: string, player: string) {
    this.players[this.normaliseId(id, 'html')] = player;
  }

  public hasPlayer (id: string): boolean {
    return this.players.hasOwnProperty(this.normaliseId(id, 'html'));
  }

  public getPlayer(id: string): string {
    return this.players[this.normaliseId(id, 'html')];
  }

  public addUnitDefinition (sequenceId: number, uDef: string) {
    this.unitDefinitions[sequenceId] = uDef;
  }

  public hasUnitDefinition (sequenceId: number): boolean {
    return this.unitDefinitions.hasOwnProperty(sequenceId);
  }

  public getUnitDefinition(sequenceId: number): string {
    return this.unitDefinitions[sequenceId];
  }

  // adding RestorePoint via newUnitRestorePoint below
  public hasUnitStateData (sequenceId: number): boolean {
    return this.unitStateDataParts.hasOwnProperty(sequenceId);
  }
  public getUnitStateData(sequenceId: number): string {
    return this.unitStateDataParts[sequenceId];
  }

  // adding PresentationComplete after unit data loading: via newUnitStatePresentationComplete below!
  public addUnitPresentationComplete (sequenceId: number, state: string) {
    this.unitPresentationCompleteStates[sequenceId] = state;
  }

  public hasUnitPresentationComplete (sequenceId: number): boolean {
    return this.unitPresentationCompleteStates.hasOwnProperty(sequenceId);
  }

  public getUnitPresentationComplete(sequenceId: number): string {
    return this.unitPresentationCompleteStates[sequenceId];
  }

  public addBookletLog(logKey: LogEntryKey, entry = '') {
    if (this.testMode.saveResponses) {
      const entryData = entry.length > 0 ? logKey + ': ' + JSON.stringify(entry) : logKey;
      this.bs.addBookletLog(this.testId, Date.now(), entryData);
    }
  }

  public setBookletState(stateKey: LastStateKey, state: string) {
    if (this.testMode.saveResponses) {
      this.bs.setBookletState(this.testId, stateKey, state);
    }
  }

  public addUnitLog(unitDbKey: string, logKey: LogEntryKey, entry = '') {
    if (this.testMode.saveResponses && this.testStatus$.getValue() === TestStatus.RUNNING) {
      const entryString = entry.length > 0 ? logKey + ': ' + JSON.stringify(entry) : logKey;
      this.bs.addUnitLog(this.testId, Date.now(), unitDbKey, entryString);
    }
  }

  public addUnitStateData(unitSequenceId: number, dataPartsAllString: string) {
    this.unitStateDataParts[unitSequenceId] = dataPartsAllString;
  }

  public newUnitStateData(unitDbKey: string, unitSequenceId: number, dataPartsAllString: string, unitStateDataType: string) {
    this.unitStateDataParts[unitSequenceId] = dataPartsAllString;
    if (this.testMode.saveResponses) {
      this.unitStateDataToSave$.next({unitDbKey, dataPartsAllString: dataPartsAllString, unitStateDataType});
    }
  }

  public newUnitStatePresentationProgress(unitDbKey: string, unitSequenceId: number, presentationProgress: string) {
    if (!this.unitPresentationCompleteStates[unitSequenceId] || this.unitPresentationCompleteStates[unitSequenceId] === 'none') {
      this.unitPresentationCompleteStates[unitSequenceId] = presentationProgress;
    } else if (this.unitPresentationCompleteStates[unitSequenceId] === 'some' && presentationProgress === 'complete'){
      this.unitPresentationCompleteStates[unitSequenceId] = presentationProgress;
    }
    if (this.testMode.saveResponses) {
      // TODO prove if state change can be logged to save calls
      this.addUnitLog(unitDbKey, LogEntryKey.PRESENTATIONCOMPLETE, presentationProgress);
      this.bs.setUnitStatus(this.testId, unitDbKey, {PRESENTATIONCOMPLETE: presentationProgress});
    }
  }

  public newUnitStateResponseProgress(unitDbKey: string, unitSequenceId: number, responseProgress: string) {
    if (this.testMode.saveResponses) {
      // TODO prove if state change can be logged to save calls
      this.addUnitLog(unitDbKey, LogEntryKey.RESPONSESCOMPLETE, responseProgress);
      this.bs.setUnitStatus(this.testId, unitDbKey, {RESPONSESCOMPLETE: responseProgress});
    }
  }

  public newUnitStatePage(unitDbKey: string, pageName: string, pageNr: number, pagesCount: number) {
    if (this.testMode.saveResponses) {
      this.bs.setUnitStatus(this.testId, unitDbKey, {
          PAGE_NR: pageNr,
          PAGE_NAME: pageName,
          PAGES_COUNT: pagesCount
      });
    }
  }

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

  public cancelMaxTimer() {
    if (this.maxTimeIntervalSubscription !== null) {
      this.maxTimeIntervalSubscription.unsubscribe();
      this.maxTimeIntervalSubscription = null;
      this.maxTimeTimer$.next(new MaxTimerData(0, this.currentMaxTimerTestletId, MaxTimerDataType.CANCELLED));
    }
    this.currentMaxTimerTestletId = '';
  }

  public interruptMaxTimer() {
    if (this.maxTimeIntervalSubscription !== null) {
      this.maxTimeIntervalSubscription.unsubscribe();
      this.maxTimeIntervalSubscription = null;
      this.maxTimeTimer$.next(new MaxTimerData(0, this.currentMaxTimerTestletId, MaxTimerDataType.INTERRUPTED));
    }
    this.currentMaxTimerTestletId = '';
  }

  public updateMinMaxUnitSequenceId(startWith: number) {
    if (this.rootTestlet) {
      this.minUnitSequenceId = this.rootTestlet.getFirstUnlockedUnitSequenceId(startWith);
      this.maxUnitSequenceId = this.rootTestlet.getLastUnlockedUnitSequenceId(startWith);
    }
  }

  public terminateTest(logEntryKey: string) {
    if (this.testMode.saveResponses) {
      this.bs.addBookletLog(this.testId, Date.now(), logEntryKey)
          .add(() => {
            console.log('AFTER LOG');
            // TODO who evaluates TestStatus when navigating to root?
            this.bs.lockTest(this.testId).subscribe(bsOk => {
              this.testStatus$.next(bsOk ? TestStatus.TERMINATED : TestStatus.ERROR);
              this.router.navigate(['/'], {state: {force: true}});
            });
          });
    } else {
      this.testStatus$.next(TestStatus.TERMINATED);
      this.router.navigate(['/'], {state: {force: true}});
    }
  }

  public setUnitNavigationRequest(navString: string, force = false) {
    if (!this.rootTestlet) {
      this.router.navigate([`/t/${this.testId}/status`], {skipLocationChange: true});
    } else {
      switch (navString) {
        case UnitNavigationTarget.ERROR:
        case UnitNavigationTarget.PAUSE:
          this.router.navigate([`/t/${this.testId}/status`], {skipLocationChange: true, state: {force: force}});
          break;
        case UnitNavigationTarget.MENU:
          this.router.navigate([`/t/${this.testId}/menu`], {state: {force: force}});
          break;
        case UnitNavigationTarget.NEXT:
          let startWith = this.currentUnitSequenceId;
          if (startWith < this.minUnitSequenceId) {
            startWith = this.minUnitSequenceId - 1;
          }
          const nextUnitSequenceId = this.rootTestlet.getNextUnlockedUnitSequenceId(startWith);
          if (nextUnitSequenceId > 0) {
            this.router.navigate([`/t/${this.testId}/u/${nextUnitSequenceId}`],
              {state: {force: force}});
          }
          break;
        case UnitNavigationTarget.PREVIOUS:
          this.router.navigate([`/t/${this.testId}/u/${this.currentUnitSequenceId - 1}`],
            {state: {force: force}});
          break;
        case UnitNavigationTarget.FIRST:
          this.router.navigate([`/t/${this.testId}/u/${this.minUnitSequenceId}`],
            {state: {force: force}});
          break;
        case UnitNavigationTarget.LAST:
          this.router.navigate([`/t/${this.testId}/u/${this.maxUnitSequenceId}`],
            {state: {force: force}});
          break;
        case UnitNavigationTarget.END:
          this.terminateTest(force ? 'BOOKLETLOCKEDforced' : 'BOOKLETLOCKEDbyTESTEE');
          break;

        default:
          this.router.navigate([`/t/${this.testId}/u/${navString}`],
            {state: {force: force}});
          break;
      }
    }
  }
}
