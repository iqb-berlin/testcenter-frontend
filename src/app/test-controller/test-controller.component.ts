/* eslint-disable no-console */
import { ActivatedRoute, Router } from '@angular/router';
import {
  Component, HostListener, Inject, OnDestroy, OnInit
} from '@angular/core';
import {
  from, Observable, of, Subscription, throwError
} from 'rxjs';
import {
  concatMap, debounceTime, distinctUntilChanged, map, switchMap
} from 'rxjs/operators';
import { CustomtextService } from 'iqb-components';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  AppFocusState,
  Command,
  MaxTimerDataType,
  ReviewDialogData,
  StateReportEntry,
  TaggedString,
  TestControllerState,
  TestData,
  TestLogEntryKey,
  TestStateKey,
  UnitData,
  UnitNavigationTarget, UnitStateKey,
  WindowFocusState
} from './test-controller.interfaces';
import {
  EnvironmentData, MaxTimerData, Testlet, UnitDef
} from './test-controller.classes';
import { BackendService } from './backend.service';
import { MainDataService } from '../maindata.service';
import { TestControllerService } from './test-controller.service';
import { ReviewDialogComponent } from './review-dialog/review-dialog.component';
// eslint-disable-next-line import/extensions
import { BookletConfig } from '../config/booklet-config';
import { TestMode } from '../config/test-mode';
import { CommandService } from './command.service';

@Component({
  templateUrl: './test-controller.component.html',
  styleUrls: ['./test-controller.component.css']
})
export class TestControllerComponent implements OnInit, OnDestroy {
  static localStorageTestKey = 'iqb-tc-t';
  private errorReportingSubscription: Subscription = null;
  private testStatusSubscription: Subscription = null;
  private routingSubscription: Subscription = null;
  private maxTimerSubscription: Subscription = null;
  private unitLoadSubscription: Subscription = null;
  private unitLoadBlobSubscription: Subscription = null;
  private appWindowHasFocusSubscription: Subscription = null;
  private appFocusSubscription: Subscription = null;
  private commandSubscription: Subscription = null;
  private lastUnitSequenceId = 0;
  private lastTestletIndex = 0;
  private timerRunning = false;
  private allUnitIds: string[] = [];
  private loadedUnitCount = 0;
  private unitLoadQueue: TaggedString[] = [];
  private resumeTargetUnitId = 0;
  timerValue: MaxTimerData = null;
  unitNavigationTarget = UnitNavigationTarget;
  debugPane = false;

  constructor(
    @Inject('APP_VERSION') public appVersion: string,
    @Inject('IS_PRODUCTION_MODE') public isProductionMode: boolean,
    private mds: MainDataService,
    public tcs: TestControllerService,
    private bs: BackendService,
    private reviewDialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private cts: CustomtextService,
    public cmd: CommandService
  ) {
  }

  private static getChildElements(element) {
    return Array.prototype.slice.call(element.childNodes)
      .filter(e => e.nodeType === 1);
  }

  // private: recursive reading testlets/units from xml
  private addTestletContentFromBookletXml(targetTestlet: Testlet, node: Element) {
    const childElements = TestControllerComponent.getChildElements(node);
    if (childElements.length > 0) {
      let codeToEnter = '';
      let codePrompt = '';
      let maxTime = -1;

      let restrictionElement: Element = null;
      for (let childIndex = 0; childIndex < childElements.length; childIndex++) {
        if (childElements[childIndex].nodeName === 'Restrictions') {
          restrictionElement = childElements[childIndex];
          break;
        }
      }
      if (restrictionElement !== null) {
        const restrictionElements = TestControllerComponent.getChildElements(restrictionElement);
        for (let childIndex = 0; childIndex < restrictionElements.length; childIndex++) {
          if (restrictionElements[childIndex].nodeName === 'CodeToEnter') {
            const restrictionParameter = restrictionElements[childIndex].getAttribute('code');
            if ((typeof restrictionParameter !== 'undefined') && (restrictionParameter !== null)) {
              codeToEnter = restrictionParameter.toUpperCase();
              codePrompt = restrictionElements[childIndex].textContent;
            }
          } else if (restrictionElements[childIndex].nodeName === 'TimeMax') {
            const restrictionParameter = restrictionElements[childIndex].getAttribute('minutes');
            if ((typeof restrictionParameter !== 'undefined') && (restrictionParameter !== null)) {
              maxTime = Number(restrictionParameter);
              if (Number.isNaN(maxTime)) {
                maxTime = -1;
              }
            }
          }
        }
      }

      if (codeToEnter.length > 0) {
        targetTestlet.codeToEnter = codeToEnter;
        targetTestlet.codePrompt = codePrompt;
      }
      targetTestlet.maxTimeLeft = maxTime;
      if (this.tcs.LastMaxTimerState) {
        if (this.tcs.LastMaxTimerState.hasOwnProperty(targetTestlet.id)) {
          targetTestlet.maxTimeLeft = this.tcs.LastMaxTimerState[targetTestlet.id];
        }
      }

      for (let childIndex = 0; childIndex < childElements.length; childIndex++) {
        if (childElements[childIndex].nodeName === 'Unit') {
          const myUnitId = childElements[childIndex].getAttribute('id');
          let myUnitAlias = childElements[childIndex].getAttribute('alias');
          if (!myUnitAlias) {
            myUnitAlias = myUnitId;
          }
          let myUnitAliasClear = myUnitAlias;
          let unitIdSuffix = 1;
          while (this.allUnitIds.indexOf(myUnitAliasClear) > -1) {
            myUnitAliasClear = `${myUnitAlias}-${unitIdSuffix.toString()}`;
            unitIdSuffix += 1;
          }
          this.allUnitIds.push(myUnitAliasClear);

          targetTestlet.addUnit(this.lastUnitSequenceId, myUnitId,
            childElements[childIndex].getAttribute('label'), myUnitAliasClear,
            childElements[childIndex].getAttribute('labelshort'));
          this.lastUnitSequenceId += 1;
        } else if (childElements[childIndex].nodeName === 'Testlet') {
          let testletId: string = childElements[childIndex].getAttribute('id');
          if (!testletId) {
            testletId = `Testlet${this.lastTestletIndex.toString()}`;
            this.lastTestletIndex += 1;
          }
          let testletLabel: string = childElements[childIndex].getAttribute('label');
          testletLabel = testletLabel ? testletLabel.trim() : '';

          this.addTestletContentFromBookletXml(targetTestlet.addTestlet(testletId, testletLabel), childElements[childIndex]);
        }
      }
    }
  }

  private getBookletFromXml(xmlString: string): Testlet {
    let rootTestlet: Testlet = null;

    try {
      const oParser = new DOMParser();
      const oDOM = oParser.parseFromString(xmlString, 'text/xml');
      if (oDOM.documentElement.nodeName === 'Booklet') {
        const metadataElements = oDOM.documentElement.getElementsByTagName('Metadata');
        if (metadataElements.length > 0) {
          const metadataElement = metadataElements[0];
          const IdElement = metadataElement.getElementsByTagName('Id')[0];
          const LabelElement = metadataElement.getElementsByTagName('Label')[0];
          rootTestlet = new Testlet(0, IdElement.textContent, LabelElement.textContent);
          const unitsElements = oDOM.documentElement.getElementsByTagName('Units');
          if (unitsElements.length > 0) {
            const customTextsElements = oDOM.documentElement.getElementsByTagName('CustomTexts');
            if (customTextsElements.length > 0) {
              const customTexts = TestControllerComponent.getChildElements(customTextsElements[0]);
              const customTextsForBooklet = {};
              for (let childIndex = 0; childIndex < customTexts.length; childIndex++) {
                if (customTexts[childIndex].nodeName === 'Text') {
                  const customTextKey = customTexts[childIndex].getAttribute('key');
                  if ((typeof customTextKey !== 'undefined') && (customTextKey !== null)) {
                    customTextsForBooklet[customTextKey] = customTexts[childIndex].textContent;
                  }
                }
              }
              this.cts.addCustomTexts(customTextsForBooklet);
            }

            const bookletConfigElements = oDOM.documentElement.getElementsByTagName('BookletConfig');

            this.tcs.bookletConfig = new BookletConfig();
            this.tcs.bookletConfig.setFromKeyValuePairs(MainDataService.getTestConfig());
            if (bookletConfigElements.length > 0) {
              this.tcs.bookletConfig.setFromXml(bookletConfigElements[0]);
            }

            // recursive call through all testlets
            this.lastUnitSequenceId = 1;
            this.lastTestletIndex = 1;
            this.allUnitIds = [];
            this.addTestletContentFromBookletXml(rootTestlet, unitsElements[0]);
          }
        }
      }
    } catch (error) {
      console.error('error reading booklet XML:', error);
      rootTestlet = null;
    }
    return rootTestlet;
  }

  private incrementProgressValueBy1() {
    this.loadedUnitCount += 1;
    this.tcs.loadProgressValue = (this.loadedUnitCount * 100) / this.lastUnitSequenceId;
  }

  // private: read unitdata
  private loadUnit(myUnit: UnitDef, sequenceId: number): Observable<number> {
    myUnit.setCanEnter('n', 'Fehler beim Laden');
    return this.bs.getUnitData(this.tcs.testId, myUnit.id, myUnit.alias)
      .pipe(
        switchMap(unit => {
          if (typeof unit === 'boolean') {
            return throwError(`error requesting unit ${this.tcs.testId}/${myUnit.id}`);
          }

          this.tcs.setOldUnitPresentationComplete(sequenceId, unit.state[UnitStateKey.PRESENTATION_PROGRESS]);

          try {
            const dataParts = unit.data ? JSON.parse(unit.data) : ''; // TODO why has this to be done. an issue in the simple-player?
            this.tcs.addUnitStateDataParts(sequenceId, dataParts);
          } catch (error) {
            console.warn(`error parsing unit state ${this.tcs.testId}/${myUnit.id} (${error.toString()})`, unit.data);
          }

          myUnit.playerId = unit.playerId;
          if (unit.definitionRef) {
            this.unitLoadQueue.push(<TaggedString>{
              tag: sequenceId.toString(),
              value: unit.definitionRef
            });
          } else {
            this.tcs.addUnitDefinition(sequenceId, unit.definition);
          }
          myUnit.setCanEnter('y', '');

          if (this.tcs.hasPlayer(unit.playerId)) {
            return of(sequenceId);
          }
          // to avoid multiple calls before returning:
          this.tcs.addPlayer(unit.playerId, '');
          return this.bs.getResource(this.tcs.testId, '', this.tcs.normaliseId(unit.playerId, 'html'), true)
            .pipe(
              switchMap((data: number|TaggedString) => {
                if (typeof data === 'number') {
                  return throwError(`error getting player "${unit.playerId}"`);
                }
                const player = data as TaggedString;
                if (player.value.length > 0) {
                  this.tcs.addPlayer(unit.playerId, player.value);
                  return of(sequenceId);
                }
                return throwError(`error getting player "${unit.playerId}" (size = 0)`);
              })
            );
        })
      );
  }

  @HostListener('window:unload', ['$event'])
  unloadHandler() {
    if (this.cmd.connectionStatus$.getValue() !== 'ws-online') {
      this.bs.notifyDyingTest(this.tcs.testId);
    }
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.mds.progressVisualEnabled = false;
      // TODO rethink if different behaviour in production and normal mode is dangerous maybe
      if (this.isProductionMode && this.tcs.testMode.saveResponses) {
        this.mds.errorReportingSilent = true;
      }
      this.errorReportingSubscription = this.mds.appError$.subscribe(e => {
        if (this.isProductionMode && this.tcs.testMode.saveResponses) {
          console.error(`${e.label} / ${e.description}`);
        }
        this.tcs.testStatus$.next(TestControllerState.ERROR);
      });
      this.testStatusSubscription = this.tcs.testStatus$.subscribe(testControllerState => {
        if (this.tcs.testMode.saveResponses && [TestControllerState.FINISHED, TestControllerState.INIT, TestControllerState.LOADING].indexOf(testControllerState) === -1) {
          this.bs.updateTestState(this.tcs.testId, [<StateReportEntry>{
            key: TestStateKey.CONTROLLER, timeStamp: Date.now(), content: testControllerState
          }]);
        }

        switch (testControllerState) {
          case TestControllerState.ERROR:
            this.tcs.loadProgressValue = 0;
            this.tcs.setUnitNavigationRequest(UnitNavigationTarget.ERROR);
            break;
          case TestControllerState.PAUSED:
            // TODO pause time
            this.tcs.setUnitNavigationRequest(UnitNavigationTarget.PAUSE, true);
            break;
        }
      });
      this.appWindowHasFocusSubscription = this.mds.appWindowHasFocus$.subscribe(hasFocus => {
        this.tcs.windowFocusState$.next(hasFocus ? WindowFocusState.HOST : WindowFocusState.UNKNOWN);
      });
      this.commandSubscription = this.cmd.command$.pipe(
        distinctUntilChanged((command1: Command, command2: Command): boolean => (command1.id === command2.id))
      )
        .subscribe((command: Command) => {
          this.handleCommand(command.keyword, command.arguments);
        });

      this.routingSubscription = this.route.params.subscribe(params => {
        if (this.tcs.testStatus$.getValue() !== TestControllerState.ERROR) {
          this.tcs.testId = params.t;

          // Reset TestMode to be Demo, before the correct one comes with getTestData
          // TODO maybe it would be better to retrieve the testmode from the login
          this.tcs.testMode = new TestMode();

          localStorage.setItem(TestControllerComponent.localStorageTestKey, params.t);

          this.unsubscribeTestSubscriptions();

          this.maxTimerSubscription = this.tcs.maxTimeTimer$.subscribe(maxTimerData => {
            switch (maxTimerData.type) {
              case MaxTimerDataType.STARTED:
                this.snackBar.open(this.cts.getCustomText('booklet_msgTimerStarted') +
                    maxTimerData.timeLeftMinString, '', { duration: 3000 });
                this.timerValue = maxTimerData;
                break;
              case MaxTimerDataType.ENDED:
                this.snackBar.open(this.cts.getCustomText('booklet_msgTimeOver'), '', { duration: 3000 });
                this.tcs.rootTestlet.setTimeLeft(maxTimerData.testletId, 0);
                this.tcs.LastMaxTimerState[maxTimerData.testletId] = 0;
                if (this.tcs.testMode.saveResponses) {
                  this.bs.updateTestState(this.tcs.testId, [<StateReportEntry>{
                    key: TestStateKey.TESTLETS_TIMELEFT, timeStamp: Date.now(), content: JSON.stringify(this.tcs.LastMaxTimerState)
                  }]);
                }
                this.timerRunning = false;
                this.timerValue = null;
                if (this.tcs.testMode.forceTimeRestrictions) {
                  this.tcs.setUnitNavigationRequest(UnitNavigationTarget.NEXT);
                }
                break;
              case MaxTimerDataType.CANCELLED:
                this.snackBar.open(this.cts.getCustomText('booklet_msgTimerCancelled'), '', { duration: 3000 });
                this.tcs.rootTestlet.setTimeLeft(maxTimerData.testletId, 0);
                this.tcs.LastMaxTimerState[maxTimerData.testletId] = 0;
                if (this.tcs.testMode.saveResponses) {
                  this.bs.updateTestState(this.tcs.testId, [<StateReportEntry>{
                    key: TestStateKey.TESTLETS_TIMELEFT, timeStamp: Date.now(), content: JSON.stringify(this.tcs.LastMaxTimerState)
                  }]);
                }
                this.timerValue = null;
                break;
              case MaxTimerDataType.INTERRUPTED:
                this.tcs.rootTestlet.setTimeLeft(maxTimerData.testletId, this.tcs.LastMaxTimerState[maxTimerData.testletId]);
                this.timerValue = null;
                break;
              case MaxTimerDataType.STEP:
                this.timerValue = maxTimerData;
                if ((maxTimerData.timeLeftSeconds % 15) === 0) {
                  this.tcs.LastMaxTimerState[maxTimerData.testletId] = Math.round(maxTimerData.timeLeftSeconds / 60);
                  if (this.tcs.testMode.saveResponses) {
                    this.bs.updateTestState(this.tcs.testId, [<StateReportEntry>{
                      key: TestStateKey.TESTLETS_TIMELEFT, timeStamp: Date.now(), content: JSON.stringify(this.tcs.LastMaxTimerState)
                    }]);
                  }
                }
                if ((maxTimerData.timeLeftSeconds / 60) === 5) {
                  this.snackBar.open(this.cts.getCustomText('booklet_msgSoonTimeOver5Minutes'), '', { duration: 3000 });
                } else if ((maxTimerData.timeLeftSeconds / 60) === 1) {
                  this.snackBar.open(this.cts.getCustomText('booklet_msgSoonTimeOver1Minute'), '', { duration: 3000 });
                }
                break;
            }
          });

          this.tcs.resetDataStore();
          const loadStartTimeStamp = Date.now();
          const envData = new EnvironmentData(this.appVersion);
          this.tcs.testStatus$.next(TestControllerState.LOADING);
          this.tcs.loadProgressValue = 0;
          this.tcs.loadComplete = false;

          this.bs.getTestData(this.tcs.testId).subscribe((testData: TestData|boolean) => {
            if ((testData === false) || (testData === true)) {
              this.mds.appError$.next({
                label: 'Konnte Testinformation nicht laden',
                description: 'TestController.Component: getTestData()',
                category: 'PROBLEM'
              });
            } else {
              this.tcs.testMode = new TestMode(testData.mode);
              let navTargetUnitId = '';
              let newTestStatus = TestControllerState.RUNNING;
              if (testData.laststate !== null) {
                Object.keys(testData.laststate).forEach(stateKey => {
                  switch (stateKey) {
                    case (TestStateKey.CURRENT_UNIT_ID):
                      navTargetUnitId = testData.laststate[stateKey];
                      break;
                    case (TestStateKey.TESTLETS_TIMELEFT):
                      this.tcs.LastMaxTimerState = JSON.parse(testData.laststate[stateKey]);
                      break;
                    case (TestStateKey.CONTROLLER):
                      if (testData.laststate[stateKey] === TestControllerState.PAUSED) {
                        newTestStatus = TestControllerState.PAUSED;
                      }
                      break;
                    case (TestStateKey.TESTLETS_CLEARED_CODE):
                      this.tcs.clearCodeTestlets = JSON.parse(testData.laststate[stateKey]);
                      break;
                  }
                });
              }
              this.tcs.rootTestlet = this.getBookletFromXml(testData.xml);

              document.documentElement.style.setProperty('--tc-unit-title-height',
                this.tcs.bookletConfig.unit_title === 'ON' ? this.mds.defaultTcUnitTitleHeight : '0');
              document.documentElement.style.setProperty('--tc-header-height',
                this.tcs.bookletConfig.unit_screenheader === 'OFF' ? '0' : this.mds.defaultTcHeaderHeight);
              document.documentElement.style.setProperty('--tc-unit-page-nav-height',
                this.tcs.bookletConfig.page_navibuttons === 'SEPARATE_BOTTOM' ? this.mds.defaultTcUnitPageNavHeight : '0');

              if (this.tcs.rootTestlet === null) {
                this.mds.appError$.next({
                  label: 'Problem beim Laden der Testinformation',
                  description: 'TestController.Component: getBookletFromXml(testData.xml)',
                  category: 'PROBLEM'
                });
                this.tcs.testStatus$.next(TestControllerState.ERROR);
              } else {
                this.tcs.maxUnitSequenceId = this.lastUnitSequenceId - 1;
                if (this.tcs.clearCodeTestlets.length > 0) {
                  this.tcs.rootTestlet.clearTestletCodes(this.tcs.clearCodeTestlets);
                }

                this.loadedUnitCount = 0;
                const sequence = [];
                for (let i = 1; i < this.tcs.maxUnitSequenceId + 1; i++) {
                  sequence.push(i);
                }

                this.unitLoadSubscription = from(sequence).pipe(
                  concatMap(uSequ => {
                    const ud = this.tcs.rootTestlet.getUnitAt(uSequ);
                    return this.loadUnit(ud.unitDef, uSequ);
                  })
                ).subscribe(() => {
                  this.incrementProgressValueBy1();
                },
                errorMessage => {
                  this.mds.appError$.next({
                    label: 'Problem beim Laden der Testinformation',
                    description: errorMessage,
                    category: 'PROBLEM'
                  });
                },
                () => {
                  this.tcs.rootTestlet.lockUnitsIfTimeLeftNull();
                  let navTarget = 1;
                  if (navTargetUnitId) {
                    const tmpNavTarget = this.tcs.rootTestlet.getSequenceIdByUnitAlias(navTargetUnitId);
                    if (tmpNavTarget > 0) {
                      navTarget = tmpNavTarget;
                    }
                  }
                  this.tcs.updateMinMaxUnitSequenceId(navTarget);
                  this.loadedUnitCount = 0;

                  this.unitLoadBlobSubscription = from(this.unitLoadQueue).pipe(
                    concatMap(queueEntry => {
                      const unitSequ = Number(queueEntry.tag);
                      if (this.tcs.bookletConfig.loading_mode === 'EAGER') {
                        this.incrementProgressValueBy1();
                      }
                      // avoid to load unit def if not necessary
                      if (unitSequ < this.tcs.minUnitSequenceId) {
                        return of(<TaggedString>{ tag: unitSequ.toString(), value: '' });
                      }
                      return this.bs.getResource(this.tcs.testId, queueEntry.tag, queueEntry.value).pipe(
                        map(response => {
                          if (typeof response === 'number') {
                            return throwError(`error loading voud ${this.tcs.testId} / ${queueEntry.tag} / ${queueEntry.value}: status ${response}`);
                          }
                          return response;
                        })
                      );
                    })
                  ).subscribe(
                    (def: TaggedString) => {
                      this.tcs.addUnitDefinition(Number(def.tag), def.value);
                    },
                    errorMessage => {
                      this.mds.appError$.next({
                        label: 'Problem beim Laden der Testinformation',
                        description: errorMessage,
                        category: 'PROBLEM'
                      });
                      this.tcs.testStatus$.next(TestControllerState.ERROR);
                    },
                    () => { // complete
                      if (this.tcs.testMode.saveResponses) {
                        envData.loadTime = Date.now() - loadStartTimeStamp;
                        this.bs.addTestLog(this.tcs.testId, [<StateReportEntry>{
                          key: TestLogEntryKey.LOADCOMPLETE, timeStamp: Date.now(), content: JSON.stringify(envData)
                        }]);
                      }
                      this.tcs.loadProgressValue = 100;

                      this.tcs.loadComplete = true;
                      if (this.tcs.bookletConfig.loading_mode === 'EAGER') {
                        this.resumeTargetUnitId = navTarget;
                        this.tcs.setUnitNavigationRequest(navTarget.toString());
                        this.tcs.testStatus$.next(newTestStatus);
                        if (this.tcs.testMode.saveResponses) {
                          this.addAppFocusSubscription();
                        }
                      }
                    }
                  );

                  if (this.tcs.bookletConfig.loading_mode === 'LAZY') {
                    this.resumeTargetUnitId = navTarget;
                    this.tcs.setUnitNavigationRequest(navTarget.toString());
                    this.tcs.testStatus$.next(newTestStatus);
                    if (this.tcs.testMode.saveResponses) {
                      this.addAppFocusSubscription();
                    }
                  }
                } // complete
                );
              }
            }
          }); // getTestData
        }
      }); // routingSubscription

      this.cmd.connectionStatus$
        .pipe(
          map(status => status === 'ws-online'),
          distinctUntilChanged()
        )
        .subscribe(isWsConnected => {
          if (this.tcs.testMode.saveResponses) {
            this.bs.updateTestState(this.tcs.testId, [{
              key: TestStateKey.CONNECTION,
              content: isWsConnected ? 'WEBSOCKET' : 'POLLING',
              timeStamp: Date.now()
            }]);
          }
        });
    }); // setTimeOut
  }

  private addAppFocusSubscription() {
    if (this.appFocusSubscription !== null) {
      this.appFocusSubscription.unsubscribe();
    }
    this.appFocusSubscription = this.tcs.windowFocusState$.pipe(
      debounceTime(500)
    ).subscribe((newState: WindowFocusState) => {
      if (newState === WindowFocusState.UNKNOWN) {
        this.bs.updateTestState(this.tcs.testId, [<StateReportEntry>{
          key: TestStateKey.FOCUS, timeStamp: Date.now(), content: AppFocusState.HAS_NOT
        }]);
      } else {
        this.bs.updateTestState(this.tcs.testId, [<StateReportEntry>{
          key: TestStateKey.FOCUS, timeStamp: Date.now(), content: AppFocusState.HAS
        }]);
      }
    });
  }

  showReviewDialog() {
    if (this.tcs.rootTestlet === null) {
      this.snackBar.open('Kein Testheft verfügbar.', '', { duration: 3000 });
    } else {
      const authData = MainDataService.getAuthData();
      const dialogRef = this.reviewDialog.open(ReviewDialogComponent, {
        width: '700px',
        data: <ReviewDialogData>{
          loginname: authData.displayName,
          bookletname: this.tcs.rootTestlet.title,
          unitTitle: this.tcs.currentUnitTitle,
          unitDbKey: this.tcs.currentUnitDbKey
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (typeof result !== 'undefined') {
          if (result !== false) {
            const targetSelection = result.target;
            if (targetSelection === 'u') {
              this.bs.saveUnitReview(
                this.tcs.testId,
                this.tcs.currentUnitDbKey,
                result.priority,
                dialogRef.componentInstance.getCategories(),
                result.sender ? `${result.sender}: ${result.entry}` : result.entry
              ).subscribe(ok => {
                if (!ok) {
                  this.snackBar.open('Konnte Kommentar nicht speichern', '', { duration: 3000 });
                } else {
                  this.snackBar.open('Kommentar gespeichert', '', { duration: 1000 });
                }
              });
            } else {
              this.bs.saveTestReview(
                this.tcs.testId,
                result.priority,
                dialogRef.componentInstance.getCategories(),
                result.sender ? `${result.sender}: ${result.entry}` : result.entry
              ).subscribe(ok => {
                if (!ok) {
                  this.snackBar.open('Konnte Kommentar nicht speichern', '', { duration: 3000 });
                } else {
                  this.snackBar.open('Kommentar gespeichert', '', { duration: 1000 });
                }
              });
            }
          }
        }
      });
    }
  }

  private unsubscribeTestSubscriptions() {
    if (this.maxTimerSubscription !== null) {
      this.maxTimerSubscription.unsubscribe();
      this.maxTimerSubscription = null;
    }
    if (this.unitLoadSubscription !== null) {
      this.unitLoadSubscription.unsubscribe();
      this.unitLoadSubscription = null;
    }
    if (this.unitLoadBlobSubscription !== null) {
      this.unitLoadBlobSubscription.unsubscribe();
      this.unitLoadBlobSubscription = null;
    }
  }

  handleCommand(commandName: string, params: string[]) {
    switch (commandName.toLowerCase()) {
      case 'debug':
        this.debugPane = params.length === 0 || params[0].toLowerCase() !== 'off';
        if (this.debugPane) {
          console.log('select (focus) app window to see the debugPane');
        }
        break;
      case 'pause':
        this.tcs.interruptMaxTimer();
        this.tcs.testStatus$.next(TestControllerState.PAUSED);
        this.resumeTargetUnitId = this.tcs.currentUnitSequenceId;
        break;
      case 'resume':
        const navTarget = (this.resumeTargetUnitId > 0) ? this.resumeTargetUnitId.toString() : UnitNavigationTarget.FIRST;
        this.tcs.testStatus$.next(TestControllerState.RUNNING);
        this.tcs.setUnitNavigationRequest(navTarget, true);
        break;
      case 'terminate':
        this.tcs.terminateTest('BOOKLETLOCKEDbyOPERATOR');
        break;
      case 'goto':
        this.tcs.testStatus$.next(TestControllerState.RUNNING);
        let gotoTarget: string;
        if ((params.length === 2) && (params[0] === 'id')) {
          gotoTarget = (this.allUnitIds.indexOf(params[1]) + 1).toString(10);
        } else if (params.length === 1) {
          gotoTarget = params[0];
        }
        if (gotoTarget && gotoTarget !== '0') {
          this.resumeTargetUnitId = 0;
          this.tcs.interruptMaxTimer();
          this.tcs.setUnitNavigationRequest(gotoTarget, true);
        }
        break;
    }
  }

  ngOnDestroy() {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
    if (this.errorReportingSubscription !== null) {
      this.errorReportingSubscription.unsubscribe();
    }
    if (this.testStatusSubscription !== null) {
      this.testStatusSubscription.unsubscribe();
    }
    if (this.appWindowHasFocusSubscription !== null) {
      this.appWindowHasFocusSubscription.unsubscribe();
    }
    if (this.appFocusSubscription !== null) {
      this.appFocusSubscription.unsubscribe();
    }
    if (this.commandSubscription !== null) {
      this.commandSubscription.unsubscribe();
    }
    this.unsubscribeTestSubscriptions();
    this.mds.progressVisualEnabled = true;
    this.mds.errorReportingSilent = false;
  }
}
