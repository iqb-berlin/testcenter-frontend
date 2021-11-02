import { debounceTime, map, takeUntil } from 'rxjs/operators';
import {
  BehaviorSubject, interval, Observable, Subject, Subscription, timer
} from 'rxjs';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MaxTimerData, Testlet } from './test-controller.classes';
import {
  KeyValuePairNumber, LoadingProgress,
  MaxTimerDataType, StateReportEntry,
  TestControllerState, TestStateKey,
  UnitNavigationTarget,
  UnitStateData, UnitStateKey, WindowFocusState
} from './test-controller.interfaces';
import { BackendService } from './backend.service';
import { TestMode } from '../config/test-mode';
// eslint-disable-next-line import/extensions
import { BookletConfig } from '../config/booklet-config';
import { VeronaNavigationDeniedReason } from './verona.interfaces';

@Injectable({
  providedIn: 'root'
})
export class TestControllerService {
  testId = '';
  testStatus$ = new BehaviorSubject<TestControllerState>(TestControllerState.INIT);
  testStatusEnum = TestControllerState;
  loadProgressValue = 0;
  clearCodeTestlets: string[] = [];

  testMode = new TestMode();
  bookletConfig = new BookletConfig();
  rootTestlet: Testlet = null;

  maxTimeTimer$ = new Subject<MaxTimerData>();
  currentMaxTimerTestletId = '';
  private maxTimeIntervalSubscription: Subscription = null;

  currentUnitDbKey = '';
  currentUnitTitle = '';

  allUnitIds: string[] = [];

  resumeTargetUnitSequenceId = 0;

  private _navigationDenial = new Subject<{ sourceUnitSequenceId: number, reason: VeronaNavigationDeniedReason[] }>();

  get navigationDenial(): Observable<{ sourceUnitSequenceId: number, reason: VeronaNavigationDeniedReason[] }> {
    return this._navigationDenial;
  }

  private _currentUnitSequenceId$: BehaviorSubject<number> = new BehaviorSubject<number>(-Infinity);
  get currentUnitSequenceId(): number {
    return this._currentUnitSequenceId$.getValue();
  }

  set currentUnitSequenceId(v: number) {
    this._currentUnitSequenceId$.next(v);
  }

  get currentUnitSequenceId$(): Observable<number> {
    return this._currentUnitSequenceId$.asObservable();
  }

  lastMaxTimerState: KeyValuePairNumber = {};

  private players: { [filename: string]: string } = {};
  private unitDefinitions: { [sequenceId: number]: string } = {};
  private unitStateDataParts: { [sequenceId: number]: string } = {};
  private unitPresentationProgressStates: { [sequenceId: number]: string } = {};
  private unitResponseCompleteStates: { [sequenceId: number]: string } = {};
  private unitStateCurrentPages: { [sequenceId: number]: string } = {};
  private unitContentLoadProgress$: { [sequenceId: number]: Observable<LoadingProgress> } = {};

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
    this.clearCodeTestlets = [];
    this.currentUnitSequenceId = 0;
    this.currentUnitDbKey = '';
    this.currentUnitTitle = '';
    if (this.maxTimeIntervalSubscription !== null) {
      this.maxTimeIntervalSubscription.unsubscribe();
      this.maxTimeIntervalSubscription = null;
    }
    this.currentMaxTimerTestletId = '';
    this.lastMaxTimerState = {};
    this.unitPresentationProgressStates = {};
  }

  // uppercase and add extension if not part
  static normaliseId(id: string, expectedExtension = ''): string {
    let normalisedId = id.trim().toUpperCase();
    const normalisedExtension = expectedExtension.toUpperCase();
    if (normalisedExtension && (normalisedId.split('.').pop() !== normalisedExtension)) {
      normalisedId += `.${normalisedExtension}`;
    }
    return normalisedId;
  }

  addPlayer(id: string, player: string): void {
    this.players[TestControllerService.normaliseId(id, 'html')] = player;
  }

  hasPlayer(id: string): boolean {
    return TestControllerService.normaliseId(id, 'html') in this.players;
  }

  getPlayer(id: string): string {
    return this.players[TestControllerService.normaliseId(id, 'html')];
  }

  addUnitDefinition(sequenceId: number, uDef: string): void {
    this.unitDefinitions[sequenceId] = uDef;
  }

  hasUnitDefinition(sequenceId: number): boolean {
    return sequenceId in this.unitDefinitions;
  }

  getUnitDefinition(sequenceId: number): string {
    return this.unitDefinitions[sequenceId];
  }

  hasUnitStateDataParts(sequenceId: number): boolean {
    return sequenceId in this.unitStateDataParts;
  }

  getUnitStateDataParts(sequenceId: number): string {
    return this.unitStateDataParts[sequenceId];
  }

  addUnitStateDataParts(unitSequenceId: number, dataPartsAllString: string): void {
    this.unitStateDataParts[unitSequenceId] = dataPartsAllString;
  }

  setOldUnitPresentationProgress(sequenceId: number, state: string): void {
    this.unitPresentationProgressStates[sequenceId] = state;
  }

  hasUnitPresentationProgress(sequenceId: number): boolean {
    return sequenceId in this.unitPresentationProgressStates;
  }

  getUnitPresentationProgress(sequenceId: number): string {
    return this.unitPresentationProgressStates[sequenceId];
  }

  hasUnitResponseProgress(sequenceId: number): boolean {
    return sequenceId in this.unitResponseCompleteStates;
  }

  getUnitResponseProgress(sequenceId: number): string {
    return this.unitResponseCompleteStates[sequenceId];
  }

  hasUnitStateCurrentPage(sequenceId: number): boolean {
    return sequenceId in this.unitStateCurrentPages;
  }

  getUnitStateCurrentPage(sequenceId: number): string {
    return this.unitStateCurrentPages[sequenceId];
  }

  setOldUnitDataCurrentPage(sequenceId: number, pageId: string): void {
    this.unitStateCurrentPages[sequenceId] = pageId;
  }

  setUnitLoadProgress$(sequenceId: number, progress: Observable<LoadingProgress>): void {
    this.unitContentLoadProgress$[sequenceId] = progress;
  }

  getUnitLoadProgress$(sequenceId: number): Observable<LoadingProgress> {
    return this.unitContentLoadProgress$[sequenceId];
  }

  newUnitStateData(unitDbKey: string, sequenceId: number, dataPartsAllString: string, unitStateDataType: string): void {
    this.unitStateDataParts[sequenceId] = dataPartsAllString;
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
    if (!this.unitPresentationProgressStates[unitSequenceId] || this.unitPresentationProgressStates[unitSequenceId] === 'none') {
      this.unitPresentationProgressStates[unitSequenceId] = presentationProgress;
      stateChanged = true;
    } else if (this.unitPresentationProgressStates[unitSequenceId] === 'some' && presentationProgress === 'complete') {
      this.unitPresentationProgressStates[unitSequenceId] = presentationProgress;
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

  newUnitStateCurrentPage(unitDbKey: string, unitSequenceId: number, pageNr: number, pageId: string, pageCount: number): void {
    this.unitStateCurrentPages[unitSequenceId] = pageId;
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

  notifyNavigationDenied(sourceUnitSequenceId: number, reason: VeronaNavigationDeniedReason[]): void {
    this._navigationDenial.next({ sourceUnitSequenceId, reason });
  }

  terminateTest(logEntryKey: string, force: boolean, lockTest: boolean = false): void {
    if (
      (this.testStatus$.getValue() === TestControllerState.TERMINATED) ||
      (this.testStatus$.getValue() === TestControllerState.FINISHED)
    ) {
      // sometimes terminateTest get called two times from player
      return;
    }

    const oldTestStatus = this.testStatus$.getValue();
    this.testStatus$.next(TestControllerState.TERMINATED); // last state that will an can be logged

    this.router.navigate(['/r/test-starter'], { state: { force } })
      .then(navigationSuccessful => {
        if (!(navigationSuccessful || force)) {
          this.testStatus$.next(oldTestStatus); // navigation was denied, test continues
          return;
        }
        this.finishTest(logEntryKey, lockTest);
      });
  }

  private finishTest(logEntryKey: string, lockTest: boolean = false): void {
    if (lockTest) {
      this.bs.lockTest(this.testId, Date.now(), logEntryKey)
        .subscribe(bsOk => {
          this.testStatus$.next(bsOk ? TestControllerState.FINISHED : TestControllerState.ERROR);
        });
    } else {
      this.testStatus$.next(TestControllerState.FINISHED); // will not be logged, test is already locked maybe
    }
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
        case UnitNavigationTarget.NEXT:
          this.router.navigate([`/t/${this.testId}/u/${this.currentUnitSequenceId + 1}`], { state: { force } });
          break;
        case UnitNavigationTarget.PREVIOUS:
          this.router.navigate([`/t/${this.testId}/u/${this.currentUnitSequenceId - 1}`], { state: { force } });
          break;
        case UnitNavigationTarget.FIRST:
          this.router.navigate([`/t/${this.testId}/u/1`],
            { state: { force } });
          break;
        case UnitNavigationTarget.LAST:
          this.router.navigate([`/t/${this.testId}/u/${this.allUnitIds.length}`],
            { state: { force } });
          break;
        case UnitNavigationTarget.END:
          this.terminateTest(force ? 'BOOKLETLOCKEDforced' : 'BOOKLETLOCKEDbyTESTEE', force);
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

  errorOut(): void {
    this.loadProgressValue = 0;
    this.testStatus$.next(TestControllerState.ERROR);
    this.setUnitNavigationRequest(UnitNavigationTarget.ERROR);
  }

  pause(): void {
    this.interruptMaxTimer();
    this.testStatus$.next(TestControllerState.PAUSED);
    this.setUnitNavigationRequest(UnitNavigationTarget.PAUSE, true);
  }

  isUnitContentLoaded(sequenceId: number): boolean {
    return !!this.unitDefinitions[sequenceId];
  }
}
