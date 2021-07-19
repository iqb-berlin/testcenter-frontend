import { debounceTime, map, takeUntil } from 'rxjs/operators';
import {
  BehaviorSubject, interval, Subject, Subscription, timer
} from 'rxjs';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MaxTimerData, Testlet } from './test-controller.classes';
import {
  KeyValuePairNumber,
  MaxTimerDataType, StateReportEntry,
  TestControllerState, TestStateKey,
  UnitNaviButtonData,
  UnitNavigationTarget,
  UnitStateData, UnitStateKey, WindowFocusState
} from './test-controller.interfaces';
import { BackendService } from './backend.service';
import { TestMode } from '../config/test-mode';
import { BookletConfig } from '../config/booklet-config';

@Injectable({
  providedIn: 'root'
})
export class TestControllerService {
  testId = '';
  testStatus$ = new BehaviorSubject<TestControllerState>(TestControllerState.INIT);
  testStatusEnum = TestControllerState;
  loadComplete = false;
  loadProgressValue = 0;
  clearCodeTestlets: string[] = [];

  testMode = new TestMode();
  bookletConfig = new BookletConfig();
  rootTestlet: Testlet = null;
  maxUnitSequenceId = 0;
  minUnitSequenceId = 0;

  maxTimeTimer$ = new Subject<MaxTimerData>();
  currentMaxTimerTestletId = '';
  private maxTimeIntervalSubscription: Subscription = null;

  private _currentUnitSequenceId: number;
  currentUnitDbKey = '';
  currentUnitTitle = '';
  unitPrevEnabled = false;
  unitNextEnabled = false;
  unitListForNaviButtons: UnitNaviButtonData[] = [];

  get currentUnitSequenceId(): number {
    return this._currentUnitSequenceId;
  }

  set currentUnitSequenceId(v: number) {
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
            disabled,
            isCurrent: sequ === v
          });
        }
      }
      this.unitListForNaviButtons = myUnitListForNaviButtons;
    }
    this._currentUnitSequenceId = v;
  }

  LastMaxTimerState: KeyValuePairNumber = {};

  private players: { [filename: string]: string } = {};
  private unitDefinitions: { [sequenceId: number]: string } = {};
  private unitStateDataParts: { [sequenceId: number]: string } = {};
  private unitPresentationCompleteStates: { [sequenceId: number]: string } = {};
  private unitResponseCompleteStates: { [sequenceId: number]: string } = {};

  private unitStateDataToSave$ = new Subject<UnitStateData>();
  windowFocusState$ = new Subject<WindowFocusState>();

  constructor(
    private router: Router,
    private bs: BackendService
  ) {
    this.unitStateDataToSave$
      .pipe(debounceTime(200))
      .subscribe(unitStateData => {
        this.bs.updateUnitStateData(
          this.testId,
          unitStateData.unitDbKey,
          JSON.stringify(unitStateData.dataPartsAllString),
          unitStateData.unitStateDataType
        ).subscribe(ok => {
          if (!ok) {
            console.warn('storing unitData failed');
          }
        });
      });
  }

  resetDataStore(): void {
    this.players = {};
    this.unitDefinitions = {};
    this.unitStateDataParts = {};
    this.rootTestlet = null;
    this.maxUnitSequenceId = 0;
    this.clearCodeTestlets = [];
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
    this.unitPresentationCompleteStates = {};
    // this.dataLoading = false; TODO set test status?
    // this.bookletLoadComplete = false;
  }

  // uppercase and add extension if not part
  normaliseId(id: string, standardext = ''): string {
    id = id.trim().toUpperCase();
    id.replace(/\s/g, '_');
    if (standardext.length > 0) {
      standardext = standardext.trim().toUpperCase();
      standardext.replace(/\s/g, '_');
      standardext = '.' + standardext.replace('.', '');

      if (id.slice(-(standardext.length)) !== standardext) {
        id = id + standardext;
      }
    }
    return id;
  }

  addPlayer(id: string, player: string): void {
    this.players[this.normaliseId(id, 'html')] = player;
  }

  hasPlayer(id: string): boolean {
    return this.players.hasOwnProperty(this.normaliseId(id, 'html'));
  }

  getPlayer(id: string): string {
    return this.players[this.normaliseId(id, 'html')];
  }

  addUnitDefinition(sequenceId: number, uDef: string): void {
    this.unitDefinitions[sequenceId] = uDef;
  }

  hasUnitDefinition(sequenceId: number): boolean {
    return this.unitDefinitions.hasOwnProperty(sequenceId);
  }

  getUnitDefinition(sequenceId: number): string {
    return this.unitDefinitions[sequenceId];
  }

  hasUnitStateData(sequenceId: number): boolean {
    return this.unitStateDataParts.hasOwnProperty(sequenceId);
  }

  getUnitStateData(sequenceId: number): string {
    return this.unitStateDataParts[sequenceId];
  }

  setOldUnitPresentationComplete(sequenceId: number, state: string): void {
    this.unitPresentationCompleteStates[sequenceId] = state;
  }

  hasUnitPresentationComplete(sequenceId: number): boolean {
    return this.unitPresentationCompleteStates.hasOwnProperty(sequenceId);
  }

  getUnitPresentationComplete(sequenceId: number): string {
    return this.unitPresentationCompleteStates[sequenceId];
  }

  addUnitStateDataParts(unitSequenceId: number, dataPartsAllString: string): void {
    this.unitStateDataParts[unitSequenceId] = dataPartsAllString;
  }

  newUnitStateData(unitDbKey: string, unitSequenceId: number, dataPartsAllString: string, unitStateDataType: string): void {
    this.unitStateDataParts[unitSequenceId] = dataPartsAllString;
    if (this.testMode.saveResponses) {
      this.unitStateDataToSave$.next({ unitDbKey, dataPartsAllString, unitStateDataType });
    }
  }

  addClearedCodeTestlet(testletId: string): void {
    if (this.clearCodeTestlets.indexOf(testletId) < 0) {
      this.clearCodeTestlets.push(testletId);
      if (this.testMode.saveResponses) {
        this.bs.updateTestState(
          this.testId,
          [<StateReportEntry>{
            key: TestStateKey.TESTLETS_CLEARED_CODE,
            timeStamp: Date.now(),
            content: JSON.stringify(this.clearCodeTestlets)
          }]
        );
      }
    }
  }

  updateUnitStatePresentationProgress(unitDbKey: string, unitSequenceId: number, presentationProgress: string): void {
    let stateChanged = false;
    if (!this.unitPresentationCompleteStates[unitSequenceId] || this.unitPresentationCompleteStates[unitSequenceId] === 'none') {
      this.unitPresentationCompleteStates[unitSequenceId] = presentationProgress;
      stateChanged = true;
    } else if (this.unitPresentationCompleteStates[unitSequenceId] === 'some' && presentationProgress === 'complete') {
      this.unitPresentationCompleteStates[unitSequenceId] = presentationProgress;
      stateChanged = true;
    }
    if (stateChanged && this.testMode.saveResponses) {
      this.bs.updateUnitState(this.testId, unitDbKey, [<StateReportEntry>{
        key: UnitStateKey.PRESENTATION_PROGRESS, timeStamp: Date.now(), content: presentationProgress
      }]);
    }
  }

  newUnitStateResponseProgress(unitDbKey: string, unitSequenceId: number, responseProgress: string): void {
    if (this.testMode.saveResponses) {
      if (!this.unitResponseCompleteStates[unitSequenceId] || this.unitResponseCompleteStates[unitSequenceId] !== responseProgress) {
        this.unitResponseCompleteStates[unitSequenceId] = responseProgress;
        this.bs.updateUnitState(this.testId, unitDbKey, [<StateReportEntry>{
          key: UnitStateKey.RESPONSE_PROGRESS, timeStamp: Date.now(), content: responseProgress
        }]);
      }
    }
  }

  newUnitStatePage(unitDbKey: string, pageNr: number, pageId: string, pageCount: number): void {
    if (this.testMode.saveResponses) {
      this.bs.updateUnitState(this.testId, unitDbKey, [
          <StateReportEntry>{ key: UnitStateKey.CURRENT_PAGE_NR, timeStamp: Date.now(), content: pageNr.toString() },
          <StateReportEntry>{ key: UnitStateKey.CURRENT_PAGE_ID, timeStamp: Date.now(), content: pageId },
          <StateReportEntry>{ key: UnitStateKey.PAGE_COUNT, timeStamp: Date.now(), content: pageCount.toString() }
      ]);
    }
  }

  startMaxTimer(testletId: string, timeLeftMinutes: number): void {
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

  cancelMaxTimer(): void {
    if (this.maxTimeIntervalSubscription !== null) {
      this.maxTimeIntervalSubscription.unsubscribe();
      this.maxTimeIntervalSubscription = null;
      this.maxTimeTimer$.next(new MaxTimerData(0, this.currentMaxTimerTestletId, MaxTimerDataType.CANCELLED));
    }
    this.currentMaxTimerTestletId = '';
  }

  interruptMaxTimer(): void {
    if (this.maxTimeIntervalSubscription !== null) {
      this.maxTimeIntervalSubscription.unsubscribe();
      this.maxTimeIntervalSubscription = null;
      this.maxTimeTimer$.next(new MaxTimerData(0, this.currentMaxTimerTestletId, MaxTimerDataType.INTERRUPTED));
    }
    this.currentMaxTimerTestletId = '';
  }

  updateMinMaxUnitSequenceId(startWith: number): void {
    if (this.rootTestlet) {
      this.minUnitSequenceId = this.rootTestlet.getFirstUnlockedUnitSequenceId(startWith);
      this.maxUnitSequenceId = this.rootTestlet.getLastUnlockedUnitSequenceId(startWith);
    }
  }

  terminateTest(logEntryKey: string, lockTest: boolean = false): void {
    if (
      (this.testStatus$.getValue() === TestControllerState.TERMINATED) ||
      (this.testStatus$.getValue() === TestControllerState.FINISHED)
    ) {
      // sometimes terminateTest get called two times from player
      return;
    }

    if (!this.testMode.saveResponses || !lockTest) {
      this.testStatus$.next(TestControllerState.FINISHED);
      this.router.navigate(['/'], { state: { force: true } });
      return;
    }

    this.testStatus$.next(TestControllerState.TERMINATED);
    this.bs.lockTest(this.testId, Date.now(), logEntryKey).subscribe(bsOk => {
      this.testStatus$.next(bsOk ? TestControllerState.FINISHED : TestControllerState.ERROR);
      this.router.navigate(['/'], { state: { force: true } });
    });
  }

  setUnitNavigationRequest(navString: string, force = false): void {
    if (!this.rootTestlet) {
      this.router.navigate([`/t/${this.testId}/status`], { skipLocationChange: true });
    } else {
      switch (navString) {
        case UnitNavigationTarget.ERROR:
        case UnitNavigationTarget.PAUSE:
          this.router.navigate([`/t/${this.testId}/status`], { skipLocationChange: true, state: { force } });
          break;
        case UnitNavigationTarget.MENU:
          this.router.navigate([`/t/${this.testId}/menu`], { state: { force } }).then(navOk => {
            if (!navOk) {
              this.router.navigate([`/t/${this.testId}/status`], { skipLocationChange: true, state: { force } });
            }
          });
          break;
        case UnitNavigationTarget.NEXT:
          let startWith = this.currentUnitSequenceId;
          if (startWith < this.minUnitSequenceId) {
            startWith = this.minUnitSequenceId - 1;
          }
          const nextUnitSequenceId = this.rootTestlet.getNextUnlockedUnitSequenceId(startWith);
          if (nextUnitSequenceId > 0) {
            this.router.navigate([`/t/${this.testId}/u/${nextUnitSequenceId}`], { state: { force } });
          }
          break;
        case UnitNavigationTarget.PREVIOUS:
          this.router.navigate([`/t/${this.testId}/u/${this.currentUnitSequenceId - 1}`],
            { state: { force } });
          break;
        case UnitNavigationTarget.FIRST:
          this.router.navigate([`/t/${this.testId}/u/${this.minUnitSequenceId}`],
            { state: { force } });
          break;
        case UnitNavigationTarget.LAST:
          this.router.navigate([`/t/${this.testId}/u/${this.maxUnitSequenceId}`],
            { state: { force } });
          break;
        case UnitNavigationTarget.END:
          this.terminateTest(force ? 'BOOKLETLOCKEDforced' : 'BOOKLETLOCKEDbyTESTEE');
          break;

        default:
          this.router.navigate(
            [`/t/${this.testId}/u/${navString}`],
            { state: { force } }
          )
            .then(navOk => {
              if (!navOk) {
                console.log(`navigation failed ("${navString}")`);
              }
            });
          break;
      }
    }
  }
}
