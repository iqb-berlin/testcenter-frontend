/* eslint-disable no-console */
import { Inject, Injectable } from '@angular/core';
import {
  BehaviorSubject,
  from, Observable, of, ReplaySubject, Subject, Subscription, throwError
} from 'rxjs';
import {
  concatMap, last, map, shareReplay, switchMap, tap
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
  private unitContentLoadSubscription: Subscription = null;
  private environment: EnvironmentData;
  private lastUnitSequenceId = 0;
  private loadedUnitCount = 0;
  private unitContentLoadQueue: TaggedString[] = [];
  private navTargetUnitId: string;
  private newTestStatus: TestControllerState;
  private lastTestletIndex = 0;

  constructor(
    @Inject('APP_VERSION') public appVersion: string,
    @Inject('IS_PRODUCTION_MODE') public isProductionMode: boolean,
    public tcs: TestControllerService,
    private bs: BackendService,
    private cts: CustomtextService
  ) {
  }

  async loadTest(testId: string): Promise<void> {
    this.reset();

    this.tcs.testStatus$.next(TestControllerState.LOADING);
    this.tcs.testId = testId;
    LocalStorage.setTestId(testId);

    const testData = await this.bs.getTestData(this.tcs.testId).toPromise();
    this.parseBooklet(testData);

    this.tcs.maxUnitSequenceId = this.lastUnitSequenceId - 1;
    if (this.tcs.clearCodeTestlets.length > 0) {
      this.tcs.rootTestlet.clearTestletCodes(this.tcs.clearCodeTestlets);
    }

    await this.loadUnits();
    this.tcs.rootTestlet.lockUnitsIfTimeLeftNull();
    this.setUpResumeNavTarget();
    return this.loadUnitContents(); // the promise resolves, when it is allowed to start
  }

  reset(): void {
    this.unsubscribeTestSubscriptions();

    // Reset TestMode to be Demo, before the correct one comes with getTestData
    // TODO maybe it would be better to retrieve the testmode from the login
    this.tcs.testMode = new TestMode();
    this.tcs.resetDataStore();
    this.tcs.loadProgressValue = 0;
    this.tcs.loadComplete = false;

    this.environment = new EnvironmentData(this.appVersion);
    this.loadStartTimeStamp = Date.now();
    this.unitContentLoadQueue = [];
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

    if (this.tcs.rootTestlet === null) {
      throw Error('Problem beim Parsen der Testinformation');
    }
  }

  private loadUnits(): Promise<number> {
    this.loadedUnitCount = 0;
    const sequence = [];
    for (let i = 1; i < this.tcs.maxUnitSequenceId + 1; i++) {
      sequence.push(i);
    }
    const loadingUnits = from(sequence)
      .pipe(
        tap(() => this.incrementProgressValueBy1()),
        concatMap(nr => this.loadUnit(this.tcs.rootTestlet.getUnitAt(nr).unitDef, nr))
      );

    return loadingUnits.toPromise();
  }

  private loadUnit(unitDef: UnitDef, sequenceId: number): Observable<number> {
    unitDef.setCanEnter('n', 'Fehler beim Laden');
    return this.bs.getUnitData(this.tcs.testId, unitDef.id, unitDef.alias)
      .pipe(
        switchMap(unit => {
          if (typeof unit === 'boolean') {
            return throwError(`error requesting unit ${this.tcs.testId}/${unitDef.id}`);
          }
          this.tcs.setOldUnitPresentationProgress(sequenceId, unit.state[UnitStateKey.PRESENTATION_PROGRESS]);
          this.tcs.setOldUnitDataCurrentPage(sequenceId, unit.state[UnitStateKey.CURRENT_PAGE_ID]);

          try {
            const dataParts = unit.data ? JSON.parse(unit.data) : '';
            // TODO why has the above to be done. an issue in the simple-player?
            this.tcs.addUnitStateDataParts(sequenceId, dataParts);
          } catch (error) {
            console.warn(`error parsing unit state ${this.tcs.testId}/${unitDef.id} (${error.toString()})`, unit.data);
          }

          unitDef.playerId = unit.playerId;
          if (unit.definitionRef) {
            this.unitContentLoadQueue.push(<TaggedString>{
              tag: sequenceId.toString(),
              value: unit.definitionRef
            });
          } else {
            this.tcs.addUnitDefinition(sequenceId, unit.definition);
            this.tcs.setUnitLoadProgress$(sequenceId, of(100));
          }
          unitDef.setCanEnter('y', '');

          if (this.tcs.hasPlayer(unit.playerId)) {
            return of(sequenceId);
          }
          // to avoid multiple calls before returning:
          this.tcs.addPlayer(unit.playerId, '');
          const playerFileId = TestControllerService.normaliseId(unit.playerId, 'html');
          return this.bs.getResource(this.tcs.testId, playerFileId, true)
            .pipe(
              last(),
              switchMap((player: string) => {
                if (player.length > 0) {
                  this.tcs.addPlayer(unit.playerId, player);
                  return of(sequenceId);
                }
                return throwError(`error getting player "${unit.playerId}" (size = 0)`);
              })
            );
        })
      );
  }

  private setUpResumeNavTarget() : void {
    let navTarget = 1;
    if (this.navTargetUnitId) {
      const tmpNavTarget = this.tcs.rootTestlet.getSequenceIdByUnitAlias(this.navTargetUnitId);
      if (tmpNavTarget > 0) {
        navTarget = tmpNavTarget;
      }
    }
    this.tcs.updateMinMaxUnitSequenceId(navTarget);
    this.tcs.resumeTargetUnitId = navTarget;
    this.loadedUnitCount = 0;
  }

  private loadUnitContents(): Promise<void> {
    // we don't load files in parallel since it made problems when a whole class tried it at once
    const unitContentLoadingProgresses$: { [unitSequenceID: number] : Subject<number> } = {};
    this.unitContentLoadQueue
      .forEach(unitToLoad => {
        unitContentLoadingProgresses$[Number(unitToLoad.tag)] = new BehaviorSubject<number>(-Infinity);
        this.tcs.setUnitLoadProgress$(
          Number(unitToLoad.tag),
          unitContentLoadingProgresses$[Number(unitToLoad.tag)].asObservable()
        );
      });
    return new Promise<void>((resolve, reject) => {
      this.unitContentLoadSubscription = from(this.unitContentLoadQueue)
        .pipe(
          concatMap(queueEntry => {
            const unitSequenceID = Number(queueEntry.tag);
            if (this.tcs.bookletConfig.loading_mode === 'EAGER') {
              this.incrementProgressValueBy1(); // TODO this does not count the right way
            }
            // avoid to load unit def if not necessary TODO is this useful?
            if (unitSequenceID < this.tcs.minUnitSequenceId) {
              return of({ unitSequenceID, content: '' });
            }

            const unitContentLoading$ = this.bs.getResource(this.tcs.testId, queueEntry.value)
              .pipe(shareReplay());

            unitContentLoading$
              .pipe(
                map(event => {
                  if (typeof event === 'number') {
                    return event;
                  }
                  console.log('GOT UNIT', event.length);
                  this.tcs.addUnitDefinition(unitSequenceID, event);
                  return 100;
                })
              )
              .subscribe(unitContentLoadingProgresses$[unitSequenceID]);

            return unitContentLoading$;
          })
        )
        .subscribe({
          error: reject,
          complete: () => {
            console.log('KOMPLETT');
            if (this.tcs.testMode.saveResponses) {
              this.environment.loadTime = Date.now() - this.loadStartTimeStamp;
              this.bs.addTestLog(this.tcs.testId, [<StateReportEntry>{
                key: TestLogEntryKey.LOADCOMPLETE, timeStamp: Date.now(), content: JSON.stringify(this.environment)
              }]);
            }
            this.tcs.loadProgressValue = 100;
            this.tcs.loadComplete = true;
            if (this.tcs.bookletConfig.loading_mode === 'EAGER') {
              this.tcs.setUnitNavigationRequest(this.tcs.resumeTargetUnitId.toString());
              this.tcs.testStatus$.next(this.newTestStatus);
              resolve();
            }
          }
        });

      if (this.tcs.bookletConfig.loading_mode === 'LAZY') {
        this.tcs.setUnitNavigationRequest(this.tcs.resumeTargetUnitId.toString());
        this.tcs.testStatus$.next(this.newTestStatus);
        resolve();
      }
    });
  }

  private unsubscribeTestSubscriptions(): void {
    if (this.unitContentLoadSubscription !== null) {
      this.unitContentLoadSubscription.unsubscribe();
      this.unitContentLoadSubscription = null;
    }
  }

  private static getChildElements(element: Element): Element[] {
    return Array.prototype.slice.call(element.childNodes)
      .filter(e => e.nodeType === 1);
  }

  private incrementProgressValueBy1(): void {
    this.loadedUnitCount += 1;
    this.tcs.loadProgressValue = (this.loadedUnitCount * 100) / this.lastUnitSequenceId;
    console.log(this.loadedUnitCount, this.lastUnitSequenceId, this.tcs.loadProgressValue);
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
