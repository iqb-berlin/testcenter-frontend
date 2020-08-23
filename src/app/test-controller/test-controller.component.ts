import {ReviewDialogComponent} from './review-dialog/review-dialog.component';
import {ActivatedRoute, Router} from '@angular/router';
import {MainDataService} from '../maindata.service';
import {BackendService} from './backend.service';

import {TestControllerService} from './test-controller.service';
import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {EnvironmentData, MaxTimerData, Testlet, UnitDef} from './test-controller.classes';
import {
  LastStateKey,
  LogEntryKey,
  MaxTimerDataType,
  ReviewDialogData,
  TaggedString,
  TestData,
  TestStatus,
  UnitData,
  UnitNavigationTarget
} from './test-controller.interfaces';
import {from, Observable, of, Subscription, throwError} from 'rxjs';
import {concatMap, map, switchMap} from 'rxjs/operators';
import {CustomtextService} from 'iqb-components';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {BookletConfig} from '../config/booklet-config';
import {TestMode} from '../config/test-mode';
import {FocusService} from './focus.service';


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
  private unitLoadXmlSubscription: Subscription = null;
  private unitLoadBlobSubscription: Subscription = null;

  private lastUnitSequenceId = 0;
  public loadProgressValue = 0;
  private lastTestletIndex = 0;
  public timerValue: MaxTimerData = null;
  private timerRunning = false;
  private allUnitIds: string[] = [];
  private loadedUnitCount = 0;
  private unitLoadQueue: TaggedString[] = [];
  unitNavigationTarget = UnitNavigationTarget;
  isTopMargin = true;
  isBottomMargin = true;

  constructor (
    @Inject('APP_VERSION') public appVersion: string,
    @Inject('IS_PRODUCTION_MODE') public isProductionMode,
    private mds: MainDataService,
    public tcs: TestControllerService,
    private bs: BackendService,
    private reviewDialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private cts: CustomtextService,
    public focusService: FocusService,
  ) {
  }

  private static getChildElements(element) {
    return Array.prototype.slice.call(element.childNodes)
    .filter(function (e) { return e.nodeType === 1; });
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
              if (isNaN(maxTime)) {
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
            myUnitAliasClear = myUnitAlias + '-' + unitIdSuffix.toString();
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
            testletId = 'Testlet' + this.lastTestletIndex.toString();
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
    this.loadProgressValue = this.loadedUnitCount * 100 / this.lastUnitSequenceId;
  }

  // private: read unitdata
  private loadUnitOk (myUnit: UnitDef, sequenceId: number): Observable<number> {
    myUnit.setCanEnter('n', 'Fehler beim Laden');
    return this.bs.getUnitData(this.tcs.testId, myUnit.id)
      .pipe(
        switchMap(myData => {
          if (myData === false) {
            return throwError(`error requesting unit ${this.tcs.testId}/${myUnit.id}`);
          } else {
            const myUnitData = myData as UnitData;
            if (myUnitData.restorepoint) {
              this.tcs.addUnitStateData(myUnit.id, sequenceId, JSON.parse(myUnitData.restorepoint));
            }
            let playerId = null;
            let definitionRef = '';

            try {
              const oParser = new DOMParser();
              const oDOM = oParser.parseFromString(myUnitData.xml, 'text/xml');

              if (oDOM.documentElement.nodeName === 'Unit') {
                const defElements = oDOM.documentElement.getElementsByTagName('Definition');

                if (defElements.length > 0) {
                  const defElement = defElements[0];
                  this.tcs.addUnitDefinition(sequenceId, defElement.textContent);
                  playerId = defElement.getAttribute('player');
                } else {
                  const defRefElements = oDOM.documentElement.getElementsByTagName('DefinitionRef');

                  if (defRefElements.length > 0) {
                    const defRefElement = defRefElements[0];
                    definitionRef = defRefElement.textContent;
                    // this.tcs.addUnitDefinition(sequenceId, '');
                    playerId = defRefElement.getAttribute('player');
                  }
                }
              }
            } catch (error) {
              return throwError(`error parsing unit def ${this.tcs.testId}/${myUnit.id} (${error.toString()})`);
            }

            if (playerId) {
              myUnit.playerId = playerId;
              if (definitionRef.length > 0) {
                this.unitLoadQueue.push(<TaggedString>{
                  tag: sequenceId.toString(),
                  value: definitionRef
                });
              }
              myUnit.setCanEnter('y', '');

              if (this.tcs.hasPlayer(playerId)) {
                return of(sequenceId);
              } else {
                // to avoid multiple calls before returning:
                this.tcs.addPlayer(playerId, '');
                return this.bs.getResource(this.tcs.testId, '', this.tcs.normaliseId(playerId, 'html'), true)
                  .pipe(
                    switchMap((data: number|TaggedString) => {
                      if (typeof data === 'number') {
                        return throwError(`error getting player "${playerId}"`);
                      } else {
                        const player = data as TaggedString;
                        if (player.value.length > 0) {
                          this.tcs.addPlayer(playerId, player.value);
                          return of(sequenceId);
                        } else {
                          return throwError(`error getting player "${playerId}" (size = 0)`);
                        }
                      }
                    }));
              }
            } else {
              return throwError(`player def missing for unit ${this.tcs.testId}/${myUnit.id}`);
            }
          }
        })
      );
  }

  ngOnInit() {
    setTimeout(() => {
      this.mds.progressVisualEnabled = false;
      // TODO rethink if different behaviour in production and normal mode is dangerous maybe
      if (this.isProductionMode && this.tcs.testMode.saveResponses) {
        this.mds.errorReportingSilent = true;
      }
      this.errorReportingSubscription = this.mds.appError$.subscribe(e => {
        if (this.isProductionMode && this.tcs.testMode.saveResponses) {
          console.error(e.label + ' / ' + e.description);
        }
        this.tcs.testStatus$.next(TestStatus.ERROR);
      });
      this.testStatusSubscription = this.tcs.testStatus$.subscribe(ts => {
        switch (ts) {
          case TestStatus.ERROR:
            this.loadProgressValue = 0;
            this.tcs.setUnitNavigationRequest(UnitNavigationTarget.ERROR);
            break;
          case TestStatus.PAUSED:
            // TODO pause time
            this.tcs.setUnitNavigationRequest(UnitNavigationTarget.PAUSE);
            break;
        }
      });

      this.routingSubscription = this.route.params.subscribe(params => {
        console.log(this.tcs.testStatus$.getValue());
        if (this.tcs.testStatus$.getValue() !== TestStatus.ERROR) {
          this.tcs.testId = params['t'];
          localStorage.setItem(TestControllerComponent.localStorageTestKey, params['t']);

          this.unsubscribeTestSubscriptions();

          this.maxTimerSubscription = this.tcs.maxTimeTimer$.subscribe(maxTimerData => {
            if (maxTimerData.type === MaxTimerDataType.STARTED) {
              this.snackBar.open(this.cts.getCustomText('booklet_msgTimerStarted') + maxTimerData.timeLeftMinString, '', {duration: 3000});
              this.timerValue = maxTimerData;
            } else if (maxTimerData.type === MaxTimerDataType.ENDED) {
              this.snackBar.open(this.cts.getCustomText('booklet_msgTimeOver'), '', {duration: 3000});
              this.tcs.rootTestlet.setTimeLeftNull(maxTimerData.testletId);
              this.tcs.LastMaxTimerState[maxTimerData.testletId] = 0;
              this.tcs.setBookletState(LastStateKey.MAXTIMELEFT, JSON.stringify(this.tcs.LastMaxTimerState));
              this.timerRunning = false;
              this.timerValue = null;
              if (this.tcs.testMode.forceTimeRestrictions) {
                this.tcs.setUnitNavigationRequest(UnitNavigationTarget.NEXT);
              }
            } else if (maxTimerData.type === MaxTimerDataType.CANCELLED) {
              this.snackBar.open(this.cts.getCustomText('booklet_msgTimerCancelled'), '', {duration: 3000});
              this.tcs.rootTestlet.setTimeLeftNull(maxTimerData.testletId);
              this.tcs.LastMaxTimerState[maxTimerData.testletId] = 0;
              this.tcs.setBookletState(LastStateKey.MAXTIMELEFT, JSON.stringify(this.tcs.LastMaxTimerState));
              this.timerValue = null;
            } else {
              this.timerValue = maxTimerData;
              if ((maxTimerData.timeLeftSeconds % 15) === 0) {
                this.tcs.LastMaxTimerState[maxTimerData.testletId] = Math.round(maxTimerData.timeLeftSeconds / 60);
                this.tcs.setBookletState(LastStateKey.MAXTIMELEFT, JSON.stringify(this.tcs.LastMaxTimerState));
              }
              if ((maxTimerData.timeLeftSeconds / 60) === 5) {
                this.snackBar.open(this.cts.getCustomText('booklet_msgSoonTimeOver5Minutes'), '', {duration: 3000});
              } else if ((maxTimerData.timeLeftSeconds / 60) === 1) {
                this.snackBar.open(this.cts.getCustomText('booklet_msgSoonTimeOver1Minute'), '', {duration: 3000});
              }
            }
          });

          this.tcs.resetDataStore();
          const envData = new EnvironmentData(this.appVersion);

          this.tcs.addBookletLog(LogEntryKey.BOOKLETLOADSTART, JSON.stringify(envData));
          this.tcs.testStatus$.next(TestStatus.WAITING_LOAD_COMPLETE);
          this.loadProgressValue = 0;
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

              let navTarget = 1;
              if (testData.laststate !== null) {
                if (testData.laststate.hasOwnProperty(LastStateKey.LASTUNIT)) {
                  const navTargetTemp = Number(testData.laststate[LastStateKey.LASTUNIT]);
                  if (!isNaN(navTargetTemp)) {
                    navTarget = navTargetTemp;
                  }
                }
                if (testData.laststate.hasOwnProperty(LastStateKey.MAXTIMELEFT) && (this.tcs.testMode.saveResponses)) {
                  this.tcs.LastMaxTimerState = JSON.parse(testData.laststate[LastStateKey.MAXTIMELEFT]);
                }
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
              } else {
                this.tcs.maxUnitSequenceId = this.lastUnitSequenceId - 1;

                this.loadedUnitCount = 0;
                const sequArray = [];
                for (let i = 1; i < this.tcs.maxUnitSequenceId + 1; i++) {
                  sequArray.push(i);
                }

                this.unitLoadXmlSubscription = from(sequArray).pipe(
                  concatMap(uSequ => {
                    const ud = this.tcs.rootTestlet.getUnitAt(uSequ);
                    return this.loadUnitOk(ud.unitDef, uSequ);
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
                          return of(<TaggedString>{tag: unitSequ.toString(), value: ''});
                        } else {
                          return this.bs.getResource(this.tcs.testId, queueEntry.tag, queueEntry.value).pipe(
                            map(response => {
                              if (typeof response === 'number') {
                                return throwError(`error loading voud ${this.tcs.testId} / ${queueEntry.tag} / ${queueEntry.value}: status ${response}`);
                              } else {
                                return response;
                              }
                            })
                          );
                        }
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
                      },
                      () => { // complete
                        this.tcs.addBookletLog(LogEntryKey.BOOKLETLOADCOMPLETE);
                        this.loadProgressValue = 100;

                        this.tcs.loadComplete = true;
                        if (this.tcs.bookletConfig.loading_mode === 'EAGER') {
                          this.tcs.setUnitNavigationRequest(navTarget.toString());
                          this.tcs.testStatus$.next(TestStatus.RUNNING);
                        }
                      }
                    );

                    if (this.tcs.bookletConfig.loading_mode === 'LAZY') {
                      this.tcs.setUnitNavigationRequest(navTarget.toString());
                      this.tcs.testStatus$.next(TestStatus.RUNNING);
                    }

                  } // complete
                );
              }
            }
          }); // getTestData
        }
      }); // routingSubscription
    }); // setTimeOut
  }

  showReviewDialog() {
    if (this.tcs.rootTestlet === null) {
      this.snackBar.open('Kein Testheft verfügbar.', '', {duration: 3000});
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
            const targetSelection = result['target'];
            if (targetSelection === 'u') {
              this.bs.saveUnitReview(
                this.tcs.testId,
                this.tcs.currentUnitDbKey,
                result['priority'],
                dialogRef.componentInstance.getCategories(),
                result['sender'] ? result['sender'] + ': ' + result['entry'] : result['entry']
                ).subscribe(ok => {
                  if (!ok) {
                    this.snackBar.open('Konnte Kommentar nicht speichern', '', {duration: 3000});
                  } else {
                    this.snackBar.open('Kommentar gespeichert', '', {duration: 1000});
                  }
                });
            } else {
              this.bs.saveBookletReview(
                this.tcs.testId,
                result['priority'],
                dialogRef.componentInstance.getCategories(),
                result['sender'] ? result['sender'] + ': ' + result['entry'] : result['entry']
              ).subscribe(ok => {
                if (!ok) {
                  this.snackBar.open('Konnte Kommentar nicht speichern', '', {duration: 3000});
                } else {
                  this.snackBar.open('Kommentar gespeichert', '', {duration: 1000});
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
    if (this.unitLoadXmlSubscription !== null) {
      this.unitLoadXmlSubscription.unsubscribe();
      this.unitLoadXmlSubscription = null;
    }
    if (this.unitLoadBlobSubscription !== null) {
      this.unitLoadBlobSubscription.unsubscribe();
      this.unitLoadBlobSubscription = null;
    }
  }

  bottomMargin() {
    this.isBottomMargin = !this.isBottomMargin;
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
    this.unsubscribeTestSubscriptions();
    this.mds.progressVisualEnabled = true;
    this.mds.errorReportingSilent = false;
  }
}
