import { ReviewDialogComponent } from './review-dialog/review-dialog.component';
import { MatDialog, MatSnackBar } from '@angular/material';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MainDataService } from './../maindata.service';
import { ServerError } from '../backend.service';
import { BackendService } from './backend.service';

import { TestControllerService } from './test-controller.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { UnitDef, Testlet, UnitControllerData } from './test-controller.classes';
import { BookletData, UnitData } from './test-controller.interfaces';
import { Subscription, Observable, of, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  templateUrl: './test-controller.component.html',
  styleUrls: ['./test-controller.component.css']
})
export class TestControllerComponent implements OnInit, OnDestroy {
  private loginDataSubscription: Subscription = null;
  // private unitPosSubsription: Subscription = null;

  // private showUnitComponent = false;
  // private allUnits: UnitDef[] = [];
  // private statusMsg = '';
  private dataLoading = false;
  private lastUnitSequenceId = 0;
  private lastTestletIndex = 0;

  constructor (
    private tcs: TestControllerService,
    private reviewDialog: MatDialog,
    private bs: BackendService,
    private mds: MainDataService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // this.unitPosSubsription = this.tcs.currentUnitPos$.subscribe(u => this.updateStatus());
  }

  // ''''''''''''''''''''''''''''''''''''''''''''''''''''
  // private: recursive reading testlets/units from xml
  // ''''''''''''''''''''''''''''''''''''''''''''''''''''
  private addTestletContentFromBookletXml(targetTestlet: Testlet, node: Element) {
    const childElements = node.children;
    if (childElements.length > 0) {
      let codeToEnter = '';
      let codePrompt = '';

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
              break;
            }
          }
        }
      }

      if (codeToEnter.length > 0) {
        targetTestlet.codeToEnter = codeToEnter;
        targetTestlet.codePrompt = codePrompt;
      }

      for (let childIndex = 0; childIndex < childElements.length; childIndex++) {
        if (childElements[childIndex].nodeName === 'Unit') {
          let reportstatus: string = childElements[childIndex].getAttribute('reportStatus');
          if ((typeof reportstatus !== 'undefined') && (reportstatus !== null)) {
            if (reportstatus.length > 0) {
              reportstatus = reportstatus.substr(0, 1).toLowerCase();
              if ((reportstatus === 'y') || (reportstatus === 'j')) {
                reportstatus = 't';
              }
            } else {
              reportstatus = 'n';
            }
          } else {
            reportstatus = 'n';
          }

          const newUnit = targetTestlet.addUnit(this.lastUnitSequenceId, childElements[childIndex].getAttribute('id'),
                childElements[childIndex].getAttribute('label'), childElements[childIndex].getAttribute('id'),
                childElements[childIndex].getAttribute('navBtnLabel'), reportstatus === 't');
          this.lastUnitSequenceId += 1;

        } else if (childElements[childIndex].nodeName === 'Testlet') {
          let testletId: string = childElements[childIndex].getAttribute('id');
          if ((typeof testletId !== 'undefined') && (testletId !== null)) {
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
            // recursive call through all testlets
            this.lastUnitSequenceId = 1;
            this.lastTestletIndex = 1;
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
      return this.bs.getResource(this.tcs.normaliseId(playerId, 'html'))
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
            this.tcs.addUnitRestorePoint(sequenceId, myUnitData.restorepoint);
            let playerId = '';
            let definitionRef = '';

            try {
              const oParser = new DOMParser();
              const oDOM = oParser.parseFromString(myUnitData.xml, 'text/xml');

              if (oDOM.documentElement.nodeName === 'Unit') {
                const defElements = oDOM.documentElement.getElementsByTagName('Definition');

                if (defElements.length > 0) {
                  const defElement = defElements[0];
                  this.tcs.addUnitDefinition(sequenceId, defElement.textContent);
                  playerId = defElement.getAttribute('type');
                } else {
                  const defRefElements = oDOM.documentElement.getElementsByTagName('DefinitionRef');

                  if (defRefElements.length > 0) {
                    const defRefElement = defRefElements[0];
                    definitionRef = defRefElement.textContent;
                    this.tcs.addUnitDefinition(sequenceId, '');
                    playerId = defRefElement.getAttribute('type');
                  }
                }
              }
            } catch (error) {
              console.log('error parsing xml for unit "' + myUnit.id + '": ' + error.toString());
              playerId = '';
              definitionRef = '';
            }

            if (playerId.length > 0) {
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

  // ==========================================================
  // ==========================================================
  ngOnInit() {
    this.router.navigateByUrl('/t');

    this.loginDataSubscription = this.mds.loginData$.subscribe(loginData => {
      this.tcs.resetDataStore();
      if ((loginData.persontoken.length > 0) && (loginData.booklet > 0)) {
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
            this.tcs.rootTestlet = this.getBookletFromXml(bookletData.xml);

            if (this.tcs.rootTestlet === null) {
              this.mds.globalErrorMsg$.next(new ServerError(0, 'Error Parsing Booklet Xml', ''));
              this.dataLoading = false;
            } else {
              this.mds.globalErrorMsg$.next(null);
              this.tcs.numberOfUnits = this.lastUnitSequenceId - 1;

              const myUnitLoadings = [];
              for (let i = 1; i < this.tcs.numberOfUnits + 1; i++) {
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

                if (loadingOk) {
                  // =================================================

                  this.goToUnitBySequenceId(1);

                  // =================================================
                } else {
                  console.log('loading failed');
                  this.mds.globalErrorMsg$.next(new ServerError(0, 'Inhalte des Testheftes konnten nicht alle geladen werden.', ''));
                  this.tcs.resetDataStore();
                }
              });
            }
          }
        });
      }
    });
  }



  // ==========================================================
  goToUnitBySequenceId(sequenceId: number) {
    if (this.tcs.rootTestlet !== null) {
      this.router.navigateByUrl('/t/u/' + sequenceId.toString());
    }
  }



  // ==========================================================
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
                    this.snackBar.open(
      'Konnte Kommentar nicht speichern (' + e.code.toString() + ': ' + e.labelNice, '', {duration: 3000});
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

  // ==========================================================
  nextUnitNaviButtonClick() {
    if (this.tcs.rootTestlet !== null) {
      this.router.navigateByUrl('/t/u/' + (this.tcs.currentUnitSequenceId + 1).toString());
    }
  }

  // ==========================================================
  prevUnitNaviButtonClick() {
    if (this.tcs.rootTestlet !== null) {
      this.router.navigateByUrl('/t/u/' + (this.tcs.currentUnitSequenceId - 1).toString());
    }
  }

  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  ngOnDestroy() {
    if (this.loginDataSubscription !== null) {
      this.loginDataSubscription.unsubscribe();
    }
  }
}
