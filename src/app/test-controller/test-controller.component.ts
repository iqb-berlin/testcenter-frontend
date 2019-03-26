import { ReviewDialogComponent } from './review-dialog/review-dialog.component';
import { MatDialog, MatSnackBar } from '@angular/material';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MainDataService } from './../maindata.service';
import { ServerError } from '../backend.service';
import { BackendService } from './backend.service';

import { TestControllerService } from './test-controller.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { UnitDef, Testlet, UnitControllerData, EnvironmentData, MaxTimerData } from './test-controller.classes';
import { LastStateKey, LogEntryKey, BookletData, UnitData, MaxTimerDataType } from './test-controller.interfaces';
import { Subscription, Observable, of, forkJoin, interval, timer } from 'rxjs';
import { switchMap, takeUntil, map } from 'rxjs/operators';

@Component({
  templateUrl: './test-controller.component.html',
  styleUrls: ['./test-controller.component.css']
})
export class TestControllerComponent implements OnInit, OnDestroy {
  private loginDataSubscription: Subscription = null;
  private navigationRequestSubsription: Subscription = null;
  private maxTimerSubscription: Subscription = null;

  public dataLoading = false;
  public showProgress = true;

  private lastUnitSequenceId = 0;
  private lastTestletIndex = 0;
  private timerValue: MaxTimerData = null;
  private timerRunning = false;
  private allUnitIds: string[] = [];
  private progressValue = 0;
  private loadedUnitCount = 0;

  constructor (
    private mds: MainDataService,
    public tcs: TestControllerService,
    private bs: BackendService,
    private reviewDialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // this.unitPosSubsription = this.tcs.currentUnitPos$.subscribe(u => this.updateStatus());
  }

  private getCostumText(key: string): string {
    const value = this.tcs.getCostumText(key);
    if (value.length > 0) {
      return value;
    } else {
      return this.mds.getCostumText(key);
    }
  }
  // ''''''''''''''''''''''''''''''''''''''''''''''''''''
  // private: recursive reading testlets/units from xml
  // ''''''''''''''''''''''''''''''''''''''''''''''''''''
  private addTestletContentFromBookletXml(targetTestlet: Testlet, node: Element) {
    const childElements = node.children;
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
        const restrictionElements = restrictionElement.children;
        for (let childIndex = 0; childIndex < restrictionElements.length; childIndex++) {
          if (restrictionElements[childIndex].nodeName === 'CodeToEnter') {
            const restrictionParameter = restrictionElements[childIndex].getAttribute('parameter');
            if ((typeof restrictionParameter !== 'undefined') && (restrictionParameter !== null)) {
              codeToEnter = restrictionParameter.toUpperCase();
              codePrompt = restrictionElements[childIndex].textContent;
            }
          } else if (restrictionElements[childIndex].nodeName === 'TimeMax') {
            const restrictionParameter = restrictionElements[childIndex].getAttribute('parameter');
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
            myUnitAliasClear = myUnitAlias + '%' + unitIdSuffix.toString();
            unitIdSuffix += 1;
          }
          this.allUnitIds.push(myUnitAliasClear);

          const newUnit = targetTestlet.addUnit(this.lastUnitSequenceId, myUnitId,
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
          if ((typeof testletLabel !== 'undefined') && (testletLabel !== null)) {
            testletLabel = testletId;
          }

          this.addTestletContentFromBookletXml(targetTestlet.addTestlet(testletId, testletLabel), childElements[childIndex]);
        }
      }
    }
  }

  // ''''''''''''''''''''''''''''''''''''''''''''''''''''
  // private: reading booklet from xml
  // ''''''''''''''''''''''''''''''''''''''''''''''''''''
  private getBookletFromXml(xmlString: string): Testlet {
    let rootTestlet: Testlet = null;

    try {
      const oParser = new DOMParser();
      const oDOM = oParser.parseFromString(xmlString, 'text/xml');
      if (oDOM.documentElement.nodeName === 'Booklet') {
        // ________________________
        const metadataElements = oDOM.documentElement.getElementsByTagName('Metadata');
        if (metadataElements.length > 0) {
          const metadataElement = metadataElements[0];
          const IdElement = metadataElement.getElementsByTagName('Id')[0];
          const LabelElement = metadataElement.getElementsByTagName('Label')[0];
          rootTestlet = new Testlet(0, IdElement.textContent, LabelElement.textContent);

          const unitsElements = oDOM.documentElement.getElementsByTagName('Units');
          if (unitsElements.length > 0) {
            const costumTextsElements = oDOM.documentElement.getElementsByTagName('CustomTexts');
            if (costumTextsElements.length > 0) {
              const costumTexts = costumTextsElements[0].children;
              const costumTextsForBooklet = {};
              for (let childIndex = 0; childIndex < costumTexts.length; childIndex++) {
                if (costumTexts[childIndex].nodeName === 'Text') {
                  const costumTextKey = costumTexts[childIndex].getAttribute('key');
                  if ((typeof costumTextKey !== 'undefined') && (costumTextKey !== null)) {
                    costumTextsForBooklet[costumTextKey] = costumTexts[childIndex].textContent;
                  }
                }
              }
              this.tcs.setCostumTexts(costumTextsForBooklet);
              console.log('##__##');
              console.log(costumTextsForBooklet);
            }

            const bookletConfigElements = oDOM.documentElement.getElementsByTagName('BookletConfig');
            if (bookletConfigElements.length > 0) {
              const bookletConfigs = bookletConfigElements[0].children;
              for (let childIndex = 0; childIndex < bookletConfigs.length; childIndex++) {
                const configParameter = bookletConfigs[childIndex].getAttribute('parameter');
                const configValue = bookletConfigs[childIndex].textContent;
                switch (bookletConfigs[childIndex].nodeName) {
                  // ----------------------
                  case 'NavPolicy':
                    if (configParameter) {
                      if (configParameter.toUpperCase() === 'NextOnlyIfPresentationComplete'.toUpperCase()) {
                        this.tcs.navPolicyNextOnlyIfPresentationComplete = true;
                      }
                    }
                    break;
                  // ----------------------
                  case 'ShowNaviButtons':
                  case 'NavButtons':
                    if (configParameter) {
                      switch (configParameter.toUpperCase()) {
                        case '1':
                        case 'ON':
                          this.tcs.navButtons = true;
                          this.tcs.navArrows = true;
                          break;
                        case 'OFF':
                          this.tcs.navButtons = false;
                          this.tcs.navArrows = false;
                          break;
                        case 'ARROWSONLY': // default
                          this.tcs.navButtons = false;
                          this.tcs.navArrows = true;
                          break;
                        default:
                          console.log('unknown booklet configParameter NavButtons "' + configParameter + '"');
                          break;
                      }
                    }
                    break;
                  // ----------------------
                  case 'PageNavBar':
                    if (configParameter) {
                      if (configParameter.toUpperCase() === 'OFF') {
                        this.tcs.pageNav = false;
                      }
                    }
                    break;
                  // ----------------------
                  case 'Logging':
                    if (configParameter) {
                      if (configParameter.toUpperCase() === 'OFF') {
                        this.tcs.logging = false;
                      }
                    }
                    break;
                  // ----------------------
                  default:
                    console.log('unknown booklet config "' + bookletConfigs[childIndex].nodeName + '"');
                    break;
                }
              }
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
      rootTestlet = null;
    }
    return rootTestlet;
  }

  // ''''''''''''''''''''''''''''''''''''''''''''''''''''
  // private: get player if not already available
  // ''''''''''''''''''''''''''''''''''''''''''''''''''''
  private loadPlayerOk(playerId: string): Observable<boolean> {
    if (this.tcs.hasPlayer(playerId)) {
      return of(true);
    } else {
      // to avoid multiple calls before returning:
      this.tcs.addPlayer(playerId, '');
      return this.bs.getResource(this.tcs.normaliseId(playerId, 'html'), true)
          .pipe(
            switchMap(myData => {
              if (myData instanceof ServerError) {
                console.log('## problem getting player "' + playerId + '"');
                return of(false);
              } else {
                const player = myData as string;
                if (player.length > 0) {
                  this.tcs.addPlayer(playerId, player);
                  return of(true);
                } else {
                  console.log('## size of player "' + playerId + '" = 0');
                  return of(false);
                }
              }
            }));
    }
  }

  private incrementProgressValueBy1() {
    this.loadedUnitCount += 1;
    this.progressValue = this.loadedUnitCount * 100 / this.lastUnitSequenceId;
  }

  // ''''''''''''''''''''''''''''''''''''''''''''''''''''
  // private: read unitdata
  // ''''''''''''''''''''''''''''''''''''''''''''''''''''
  private loadUnitOk (myUnit: UnitDef, sequenceId: number): Observable<boolean> {
    myUnit.setCanEnter('n', 'Fehler beim Laden');

    return this.bs.getUnitData(myUnit.id)
      .pipe(
        switchMap(myData => {
          if (myData instanceof ServerError) {
            const e = myData as ServerError;
            console.log('error getting unit "' + myUnit.id + '": ' + e.code.toString() + ' - ' + e.labelNice);
            return of(false);
          } else {
            const myUnitData = myData as UnitData;
            if (myUnitData.restorepoint) {
              this.tcs.newUnitRestorePoint(myUnit.id, sequenceId, JSON.parse(myUnitData.restorepoint), false);
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
                    this.tcs.addUnitDefinition(sequenceId, '');
                    playerId = defRefElement.getAttribute('player');
                  }
                }
              }
            } catch (error) {
              console.log('error parsing xml for unit "' + myUnit.id + '": ' + error.toString());
              playerId = null;
              definitionRef = '';
            }
            this.incrementProgressValueBy1();

            if (playerId) {
              myUnit.playerId = playerId;

              return this.loadPlayerOk(playerId).pipe(
                switchMap(ok => {
                  if (ok && definitionRef.length > 0) {
                    return this.bs.getResource(definitionRef).pipe(
                      switchMap(def => {
                        if (def instanceof ServerError) {
                          console.log('error getting unit "' + myUnit.id + '": getting "' + definitionRef + '" failed');
                          return of(false);
                        } else {
                          this.tcs.addUnitDefinition(sequenceId, def as string);
                          myUnit.setCanEnter('y', '');
                          return of(true);
                        }
                      }));
                  } else {
                    if (ok) {
                      myUnit.setCanEnter('y', '');
                    }
                    return of(ok);
                  }
                }));
            } else {
              console.log('error getting unit "' + myUnit.id + '": no player');
              return of(false);
            }
          }
        })
      );
  }

  // #####################################################################################
  // #####################################################################################
  ngOnInit() {
    this.router.navigateByUrl('/t');

    this.maxTimerSubscription = this.tcs.maxTimeTimer$.subscribe(maxTimerData => {
      if (maxTimerData.type === MaxTimerDataType.STARTED) {
        this.snackBar.open(this.getCostumText('booklet_msgTimerStarted') + maxTimerData.timeLeftMinString, '', {duration: 3000});
        this.timerValue = maxTimerData;
      } else if (maxTimerData.type === MaxTimerDataType.ENDED) {
        this.snackBar.open(this.getCostumText('booklet_msgTimeOver'), '', {duration: 3000});
        this.tcs.rootTestlet.setTimeLeftNull(maxTimerData.testletId);
        this.tcs.LastMaxTimerState[maxTimerData.testletId] = 0;
        this.tcs.setBookletState(LastStateKey.MAXTIMELEFT, JSON.stringify(this.tcs.LastMaxTimerState));
        this.timerRunning = false;
        this.timerValue = null;
        if (this.tcs.mode !== 'review') {
          this.tcs.setUnitNavigationRequest('#next');
        }
      } else if (maxTimerData.type === MaxTimerDataType.CANCELLED) {
        this.snackBar.open(this.getCostumText('booklet_msgTimerCancelled'), '', {duration: 3000});
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
          this.snackBar.open(this.getCostumText('booklet_msgSoonTimeOver5Minutes'), '', {duration: 3000});
        } else if ((maxTimerData.timeLeftSeconds / 60) === 1) {
          this.snackBar.open(this.getCostumText('booklet_msgSoonTimeOver1Minute'), '', {duration: 3000});
        }
      }
    });

    // ==========================================================
    // navigation between units and end booklet
    this.navigationRequestSubsription = this.tcs.navigationRequest$.subscribe((navString: string) => {
      if (this.tcs.rootTestlet === null) {
        this.snackBar.open('Kein Testheft verfügbar.', '', {duration: 3000});
      } else {
        if (!navString) {
          navString = '#next';
        }
        switch (navString) {
          case '#next':
            if (this.tcs.rootTestlet !== null) {
              let startWith = this.tcs.currentUnitSequenceId;
              if (startWith < this.tcs.minUnitSequenceId) {
                startWith = this.tcs.minUnitSequenceId - 1;
              }
              const nextUnitSequenceId = this.tcs.rootTestlet.getNextUnlockedUnitSequenceId(startWith);
              if (nextUnitSequenceId > 0) {
                this.router.navigateByUrl('/t/u/' + (nextUnitSequenceId).toString());
              }
            }
            break;
          case '#previous':
            if (this.tcs.rootTestlet !== null) {
              this.router.navigateByUrl('/t/u/' + (this.tcs.currentUnitSequenceId - 1).toString());
            }
            break;
          case '#first':
            if (this.tcs.rootTestlet !== null) {
              this.router.navigateByUrl('/t/u/' + this.tcs.minUnitSequenceId.toString());
            }
            break;
          case '#last':
            if (this.tcs.rootTestlet !== null) {
              this.router.navigateByUrl('/t/u/' + this.tcs.maxUnitSequenceId.toString());
            }
            break;
          case '#end':
            this.mds.endBooklet();
            break;

          default:
            if (this.tcs.rootTestlet !== null) {
              this.router.navigateByUrl('/t/u/' + navString);
            }
            break;
        }
      }
    });


    // ==========================================================
    // loading booklet data and all unit content
    // navigation to first unit
    this.loginDataSubscription = this.mds.loginData$.subscribe(loginData => {
      this.tcs.resetDataStore();
      if ((loginData.persontoken.length > 0) && (loginData.booklet > 0)) {
        const envData = new EnvironmentData();
        this.tcs.addBookletLog(LogEntryKey.BOOKLETLOADSTART, JSON.stringify(envData));

        this.tcs.mode = loginData.mode;
        this.tcs.loginname = loginData.loginname;

        this.dataLoading = true;
        this.bs.getBookletData().subscribe(myData => {
          if (myData instanceof ServerError) {
            const e = myData as ServerError;
            this.mds.globalErrorMsg$.next(e);
            this.dataLoading = false;
          } else {
            const bookletData = myData as BookletData;

            if (bookletData.locked) {
              console.log('loading failed');
              this.mds.globalErrorMsg$.next(new ServerError(0, 'Das Testheft ist für die Bearbeitung gesperrt.', ''));
              this.tcs.resetDataStore();
            } else {
              let navTarget = '';
              if (bookletData.laststate !== null) {
                if (bookletData.laststate.hasOwnProperty(LastStateKey.LASTUNIT)) {
                  navTarget = bookletData.laststate[LastStateKey.LASTUNIT];
                }
                if (bookletData.laststate.hasOwnProperty(LastStateKey.MAXTIMELEFT) && (loginData.mode === 'hot')) {
                  this.tcs.LastMaxTimerState = JSON.parse(bookletData.laststate[LastStateKey.MAXTIMELEFT]);
                }
              }

              this.tcs.rootTestlet = this.getBookletFromXml(bookletData.xml);

              if (this.tcs.rootTestlet === null) {
                this.mds.globalErrorMsg$.next(new ServerError(0, 'Error Parsing Booklet Xml', ''));
                this.dataLoading = false;
              } else {
                this.mds.globalErrorMsg$.next(null);
                this.tcs.maxUnitSequenceId = this.lastUnitSequenceId - 1;
                // set last maxTimer value if available
                // this.tcs.rootTestlet.setTimeLeft(bookletData.laststate);

                const myUnitLoadings = [];
                this.showProgress = true;
                this.loadedUnitCount = 0;
                for (let i = 1; i < this.tcs.maxUnitSequenceId + 1; i++) {
                  const ud = this.tcs.rootTestlet.getUnitAt(i);
                  myUnitLoadings.push(this.loadUnitOk(ud.unitDef, i));
                }
                forkJoin(myUnitLoadings).subscribe(allOk => {
                  this.dataLoading = false;

                  let loadingOk = true;
                  for (const ok of allOk) {
                    if (!ok) {
                      loadingOk = false;
                      break;
                    }
                  }
                  this.showProgress = false;

                  if (loadingOk) {
                    // =====================
                    this.tcs.bookletDbId = loginData.booklet;
                    this.tcs.addBookletLog(LogEntryKey.BOOKLETLOADCOMPLETE);
                    this.tcs.rootTestlet.lockUnitsIfTimeLeftNull();
                    if (navTarget) {
                      const navTargetNumber = Number(navTarget);
                      if (isNaN(navTargetNumber)) {
                        navTarget = '';
                      } else {
                        this.tcs.updateMinMaxUnitSequenceId(navTargetNumber);
                        if (navTargetNumber < this.tcs.minUnitSequenceId) {
                          navTarget = '';
                        }
                      }
                    }
                    if (!navTarget) {
                      this.tcs.updateMinMaxUnitSequenceId(1);
                    }

                    this.tcs.setUnitNavigationRequest(navTarget);

                    // =====================
                  } else {
                    console.log('loading failed');
                    this.mds.globalErrorMsg$.next(new ServerError(0, 'Inhalte des Testheftes konnten nicht alle geladen werden.', ''));
                    this.tcs.resetDataStore();
                  }
                });
              }
            }
          }
        });
      } else {
        this.router.navigateByUrl('/');
      }
    });
  }


  // #####################################################################################
  showReviewDialog() {
    if (this.tcs.rootTestlet === null) {
      this.snackBar.open('Kein Testheft verfügbar.', '', {duration: 3000});
    } else {
      const dialogRef = this.reviewDialog.open(ReviewDialogComponent, {
        width: '700px',
        data: {
          loginname: this.tcs.loginname,
          bookletname: this.tcs.rootTestlet.title,
          unitTitle: this.tcs.currentUnitTitle,
          unitDbKey: this.tcs.currentUnitDbKey
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (typeof result !== 'undefined') {
          if (result !== false) {
            const targetSelection = (<FormGroup>result).get('target').value;
            if (targetSelection === 'u') {
              this.bs.saveUnitReview(
                  this.tcs.currentUnitDbKey,
                  (<FormGroup>result).get('priority').value,
                  dialogRef.componentInstance.getCategories(),
                  (<FormGroup>result).get('entry').value
                ).subscribe(myData => {
                  if (myData instanceof ServerError) {
                    const e = myData as ServerError;
                    this.snackBar.open('Konnte Kommentar nicht speichern (' +
                                e.code.toString() + ': ' + e.labelNice, '', {duration: 3000});
                  } else {
                    const ok = myData as boolean;
                    if (ok) {
                      this.snackBar.open('Kommentar gespeichert', '', {duration: 1000});
                    } else {
                      this.snackBar.open('Konnte Kommentar nicht speichern.', '', {duration: 3000});
                    }
                  }
                });
            } else {
              this.bs.saveBookletReview(
              (<FormGroup>result).get('priority').value,
                dialogRef.componentInstance.getCategories(),
                (<FormGroup>result).get('entry').value
              ).subscribe(myData => {
                if (myData instanceof ServerError) {
                  const e = myData as ServerError;
                  this.snackBar.open('Konnte Kommentar nicht speichern (' + e.code.toString()
              + ': ' + e.labelNice, '', {duration: 3000});
                } else {
                  const ok = myData as boolean;
                  if (ok) {
                    this.snackBar.open('Kommentar gespeichert', '', {duration: 1000});
                  } else {
                    this.snackBar.open('Konnte Kommentar nicht speichern.', '', {duration: 3000});
                  }
                }
              });
            }
          }
        }
      });
    }
  }

  // #####################################################################################
  gotoUnit(newSequenceId: number) {
    this.tcs.setUnitNavigationRequest(newSequenceId.toString());
  }

  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  ngOnDestroy() {
    if (this.loginDataSubscription !== null) {
      this.loginDataSubscription.unsubscribe();
    }
    if (this.navigationRequestSubsription !== null) {
      this.navigationRequestSubsription.unsubscribe();
    }
    if (this.maxTimerSubscription !== null) {
      this.maxTimerSubscription.unsubscribe();
    }
  }
}
