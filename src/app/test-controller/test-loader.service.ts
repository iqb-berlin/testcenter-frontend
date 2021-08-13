/* eslint-disable no-console */
import { Inject, Injectable } from '@angular/core';
import {
  from, Observable, of, Subject, Subscription, throwError
} from 'rxjs';
import {
  concatMap, first, map, switchMap, take, tap
} from 'rxjs/operators';
import { CustomtextService } from 'iqb-components';
import {
  isOnOff,
  StateReportEntry, TaggedString,
  TestControllerState, TestData, TestLogEntryKey,
  TestStateKey,
  UnitStateKey
} from './test-controller.interfaces';
import { TestMode } from '../config/test-mode';
import {
  EnvironmentData, NavigationLeaveRestrictions, Testlet, UnitDef
} from './test-controller.classes';
import { ApiError } from '../app.interfaces';
import { MainDataService } from '../maindata.service';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import { LocalStorage } from './local-storage.util';
// eslint-disable-next-line import/extensions
import { BookletConfig } from '../config/booklet-config';

@Injectable({
  providedIn: 'root'
})
export class TestLoaderService {
  private loadStartTimeStamp = 0;
  private unitLoadSubscription: Subscription = null;
  private unitLoadBlobSubscription: Subscription = null;
  private environment: EnvironmentData;
  private lastUnitSequenceId = 0;
  private loadedUnitCount = 0;
  private unitLoadQueue: TaggedString[] = [];
  private navTargetUnitId: string;
  private newTestStatus: TestControllerState;
  private lastTestletIndex = 0;

  constructor(
    @Inject('APP_VERSION') public appVersion: string,
    @Inject('IS_PRODUCTION_MODE') public isProductionMode: boolean,
    private mds: MainDataService,
    public tcs: TestControllerService,
    private bs: BackendService,
    private cts: CustomtextService
  ) {
  }

  loadTest(testId: string): Observable<void> {
    if (this.tcs.testStatus$.getValue() === TestControllerState.ERROR) {
      // TODO does this make sense?
      // eslint-disable-next-line no-void
      return of(void 0);
    }

    this.reset();

    this.tcs.testStatus$.next(TestControllerState.LOADING);
    this.tcs.testId = testId;
    LocalStorage.setTestId(testId);

    return this.bs.getTestData(this.tcs.testId)
      .pipe(
        tap(testData => this.parseBooklet(testData)),
        switchMap(() => this.loadUnits()),
        first(),
        switchMap(() => {
          const rt$ = this.runTest();
          rt$.subscribe({
            next: n => console.log('n', n),
            error: e => console.log('e', e),
            complete: () => console.log('c')
          });
          return rt$;
        }),
        take(1),
        tap(x => console.log("im here",x)),
      );
  }

  reset(): void {
    // Reset TestMode to be Demo, before the correct one comes with getTestData
    // TODO maybe it would be better to retrieve the testmode from the login
    this.tcs.testMode = new TestMode();

    this.unsubscribeTestSubscriptions();

    this.environment = new EnvironmentData(this.appVersion);
    this.tcs.resetDataStore();
    this.loadStartTimeStamp = Date.now();
    this.tcs.loadProgressValue = 0;
    this.tcs.loadComplete = false;
  }

  private parseBooklet(testData: TestData): void {
    this.tcs.testMode = new TestMode(testData.mode);
    this.navTargetUnitId = '';
    this.newTestStatus = TestControllerState.RUNNING;
    if (testData.laststate !== null) {
      Object.keys(testData.laststate).forEach(stateKey => {
        switch (stateKey) {
          case (TestStateKey.CURRENT_UNIT_ID):
            this.navTargetUnitId = testData.laststate[stateKey];
            break;
          case (TestStateKey.TESTLETS_TIMELEFT):
            this.tcs.LastMaxTimerState = JSON.parse(testData.laststate[stateKey]);
            break;
          case (TestStateKey.CONTROLLER):
            if (testData.laststate[stateKey] === TestControllerState.PAUSED) {
              this.newTestStatus = TestControllerState.PAUSED;
            }
            break;
          case (TestStateKey.TESTLETS_CLEARED_CODE):
            this.tcs.clearCodeTestlets = JSON.parse(testData.laststate[stateKey]);
            break;
          default:
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
        label: 'Problem beim Parsen der Testinformation',
        description: '',
        category: 'PROBLEM'
      });
    }
  }

  private loadUnits(): Observable<void> {
    this.tcs.maxUnitSequenceId = this.lastUnitSequenceId - 1;
    if (this.tcs.clearCodeTestlets.length > 0) {
      this.tcs.rootTestlet.clearTestletCodes(this.tcs.clearCodeTestlets);
    }

    this.loadedUnitCount = 0;
    const sequence = [];
    for (let i = 1; i < this.tcs.maxUnitSequenceId + 1; i++) {
      sequence.push(i);
    }

    const continue$ = new Subject<void>();

    this.unitLoadSubscription = from(sequence)
      .pipe(
        concatMap(uSequ => {
          const ud = this.tcs.rootTestlet.getUnitAt(uSequ);
          return this.loadUnit(ud.unitDef, uSequ);
        })
      )
      .subscribe(
        () => {
          this.incrementProgressValueBy1();
        },
        (error: ApiError) => {
          this.mds.appError$.next({
            label: 'Problem beim Laden der Unit',
            description: error.info,
            category: 'PROBLEM'
          });
        },
        () => {
          continue$.next();
        }
      );
    return continue$;
  }

  private loadUnit(myUnit: UnitDef, sequenceId: number): Observable<number> {
    myUnit.setCanEnter('n', 'Fehler beim Laden');
    return this.bs.getUnitData(this.tcs.testId, myUnit.id, myUnit.alias)
      .pipe(
        switchMap(unit => {
          if (typeof unit === 'boolean') {
            return throwError(`error requesting unit ${this.tcs.testId}/${myUnit.id}`);
          }
          this.tcs.setOldUnitPresentationProgress(sequenceId, unit.state[UnitStateKey.PRESENTATION_PROGRESS]);
          this.tcs.setOldUnitDataCurrentPage(sequenceId, unit.state[UnitStateKey.CURRENT_PAGE_ID]);

          try {
            const dataParts = unit.data ? JSON.parse(unit.data) : '';
            // TODO why has the above to be done. an issue in the simple-player?
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
          const playerFileId = TestControllerService.normaliseId(unit.playerId, 'html');
          return this.bs.getResource(this.tcs.testId, '', playerFileId, true)
            .pipe(
              switchMap((data: TaggedString) => {
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

  private runTest(): Observable<void> {
    this.tcs.rootTestlet.lockUnitsIfTimeLeftNull();
    let navTarget = 1;
    if (this.navTargetUnitId) {
      const tmpNavTarget = this.tcs.rootTestlet.getSequenceIdByUnitAlias(this.navTargetUnitId);
      if (tmpNavTarget > 0) {
        navTarget = tmpNavTarget;
      }
    }
    this.tcs.updateMinMaxUnitSequenceId(navTarget);
    this.loadedUnitCount = 0;

    const continue$ = new Subject<void>();

    this.unitLoadBlobSubscription = from(this.unitLoadQueue)
      .pipe(
        concatMap(queueEntry => {
          const unitSequ = Number(queueEntry.tag);
          if (this.tcs.bookletConfig.loading_mode === 'EAGER') {
            this.incrementProgressValueBy1();
          }
          // avoid to load unit def if not necessary
          if (unitSequ < this.tcs.minUnitSequenceId) {
            return of(<TaggedString>{ tag: unitSequ.toString(), value: '' });
          }
          return this.bs.getResource(this.tcs.testId, queueEntry.tag, queueEntry.value);
        })
      )
      .subscribe(
        (def: TaggedString) => {
          this.tcs.addUnitDefinition(Number(def.tag), def.value);
        },
        (errorMessage: ApiError) => { // TODO even this could be omitted, interceptor does the job
          this.mds.setSpinnerOff();
          console.warn(errorMessage.info);
          this.mds.appError$.next({
            label: 'Problem beim Laden einer Unit',
            description: errorMessage.info,
            category: 'PROBLEM'
          });
          continue$.error(errorMessage);
        },
        () => { // complete
          console.log("KORMPLET", this.tcs.testMode.saveResponses, this.tcs.bookletConfig.loading_mode);
          if (this.tcs.testMode.saveResponses) {
            this.environment.loadTime = Date.now() - this.loadStartTimeStamp;
            this.bs.addTestLog(this.tcs.testId, [<StateReportEntry>{
              key: TestLogEntryKey.LOADCOMPLETE, timeStamp: Date.now(), content: JSON.stringify(this.environment)
            }]);
          }
          this.tcs.loadProgressValue = 100;
          this.tcs.loadComplete = true;
          if (this.tcs.bookletConfig.loading_mode === 'EAGER') {
            this.tcs.resumeTargetUnitId = navTarget;
            this.tcs.setUnitNavigationRequest(navTarget.toString());
            this.tcs.testStatus$.next(this.newTestStatus);
            setTimeout(
              () => {
                continue$.next();
              },
              500
            );
          }
        }
      );

    if (this.tcs.bookletConfig.loading_mode === 'LAZY') {
      this.tcs.resumeTargetUnitId = navTarget;
      this.tcs.setUnitNavigationRequest(navTarget.toString());
      this.tcs.testStatus$.next(this.newTestStatus);
      if (this.tcs.testMode.saveResponses) {
        continue$.next();
      }
    }

    return continue$;
  }

  private unsubscribeTestSubscriptions() {
    if (this.unitLoadSubscription !== null) {
      this.unitLoadSubscription.unsubscribe();
      this.unitLoadSubscription = null;
    }
    if (this.unitLoadBlobSubscription !== null) {
      this.unitLoadBlobSubscription.unsubscribe();
      this.unitLoadBlobSubscription = null;
    }
  }

  private static getChildElements(element: Element): Element[] {
    return Array.prototype.slice.call(element.childNodes)
      .filter(e => e.nodeType === 1);
  }

  private incrementProgressValueBy1() {
    this.loadedUnitCount += 1;
    this.tcs.loadProgressValue = (this.loadedUnitCount * 100) / this.lastUnitSequenceId;
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
              const customTexts = TestLoaderService.getChildElements(customTextsElements[0]);
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
            this.tcs.allUnitIds = [];
            this.addTestletContentFromBookletXml(
              rootTestlet,
              unitsElements[0],
              new NavigationLeaveRestrictions(
                this.tcs.bookletConfig.force_presentation_complete,
                this.tcs.bookletConfig.force_response_complete
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('error reading booklet XML:', error);
      rootTestlet = null;
    }
    return rootTestlet;
  }

  private addTestletContentFromBookletXml(targetTestlet: Testlet, node: Element,
                                          navigationLeaveRestrictions: NavigationLeaveRestrictions) {
    const childElements = TestLoaderService.getChildElements(node);
    if (childElements.length > 0) {
      let codeToEnter = '';
      let codePrompt = '';
      let maxTime = -1;
      let forcePresentationComplete = navigationLeaveRestrictions.presentationComplete;
      let forceResponseComplete = navigationLeaveRestrictions.responseComplete;

      let restrictionElement: Element = null;
      for (let childIndex = 0; childIndex < childElements.length; childIndex++) {
        if (childElements[childIndex].nodeName === 'Restrictions') {
          restrictionElement = childElements[childIndex];
          break;
        }
      }
      if (restrictionElement !== null) {
        const restrictionElements = TestLoaderService.getChildElements(restrictionElement);
        for (let childIndex = 0; childIndex < restrictionElements.length; childIndex++) {
          if (restrictionElements[childIndex].nodeName === 'CodeToEnter') {
            const restrictionParameter = restrictionElements[childIndex].getAttribute('code');
            if ((typeof restrictionParameter !== 'undefined') && (restrictionParameter !== null)) {
              codeToEnter = restrictionParameter.toUpperCase();
              codePrompt = restrictionElements[childIndex].textContent;
            }
          }
          if (restrictionElements[childIndex].nodeName === 'TimeMax') {
            const restrictionParameter = restrictionElements[childIndex].getAttribute('minutes');
            if ((typeof restrictionParameter !== 'undefined') && (restrictionParameter !== null)) {
              maxTime = Number(restrictionParameter);
              if (Number.isNaN(maxTime)) {
                maxTime = -1;
              }
            }
          }
          if (restrictionElements[childIndex].nodeName === 'DenyNavigation') {
            const presentationComplete = restrictionElements[childIndex].getAttribute('force_presentation_complete');
            if (isOnOff(presentationComplete)) {
              forcePresentationComplete = presentationComplete;
            }
            const responseComplete = restrictionElements[childIndex].getAttribute('force_response_complete');
            if (isOnOff(responseComplete)) {
              forceResponseComplete = responseComplete;
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
        if (targetTestlet.id in this.tcs.LastMaxTimerState) {
          targetTestlet.maxTimeLeft = this.tcs.LastMaxTimerState[targetTestlet.id];
        }
      }
      const newNavigationLeaveRestrictions =
        new NavigationLeaveRestrictions(forcePresentationComplete, forceResponseComplete);

      for (let childIndex = 0; childIndex < childElements.length; childIndex++) {
        if (childElements[childIndex].nodeName === 'Unit') {
          const unitId = childElements[childIndex].getAttribute('id');
          let unitAlias = childElements[childIndex].getAttribute('alias');
          if (!unitAlias) {
            unitAlias = unitId;
          }
          let unitAliasClear = unitAlias;
          let unitIdSuffix = 1;
          while (this.tcs.allUnitIds.indexOf(unitAliasClear) > -1) {
            unitAliasClear = `${unitAlias}-${unitIdSuffix.toString()}`;
            unitIdSuffix += 1;
          }
          this.tcs.allUnitIds.push(unitAliasClear);

          targetTestlet.addUnit(
            this.lastUnitSequenceId,
            unitId,
            childElements[childIndex].getAttribute('label'),
            unitAliasClear,
            childElements[childIndex].getAttribute('labelshort'),
            newNavigationLeaveRestrictions
          );
          this.lastUnitSequenceId += 1;
        } else if (childElements[childIndex].nodeName === 'Testlet') {
          let testletId: string = childElements[childIndex].getAttribute('id');
          if (!testletId) { // TODO this can not happen, so remove it?
            testletId = `Testlet${this.lastTestletIndex.toString()}`;
            this.lastTestletIndex += 1;
          }
          let testletLabel: string = childElements[childIndex].getAttribute('label');
          testletLabel = testletLabel ? testletLabel.trim() : '';

          this.addTestletContentFromBookletXml(
            targetTestlet.addTestlet(testletId, testletLabel),
            childElements[childIndex],
            newNavigationLeaveRestrictions
          );
        }
      }
    }
  }
}
