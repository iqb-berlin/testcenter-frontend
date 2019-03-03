import { MainDataService } from './../maindata.service';
import { ServerError } from '../backend.service';
import { BackendService } from './backend.service';

import { TestControllerService } from './test-controller.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { UnitDef, Testlet } from './test-controller.classes';
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
    private bs: BackendService,
    private mds: MainDataService
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
                return of(false);
              } else {
                const player = myData as string;
                if (player.length > 0) {
                  this.tcs.addPlayer(playerId, player);
                  return of(true);
                } else {
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

              return this.loadPlayerOk(playerId).pipe(
                switchMap(ok => {
                  if (ok && definitionRef.length > 0) {
                    return this.bs.getResource(definitionRef).pipe(
                      switchMap(def => {
                        if (def instanceof ServerError) {
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
    this.loginDataSubscription = this.mds.loginData$.subscribe(loginData => {
      this.tcs.resetDataStore();
      if ((loginData.persontoken.length > 0) && (loginData.booklet > 0)) {
        this.tcs.mode = loginData.mode;

        this.dataLoading = true;
        this.bs.getBookletData().subscribe(myData => {
          if (myData instanceof ServerError) {
            const e = myData as ServerError;
            this.mds.globalErrorMsg$.next(e);
          } else {
            const bookletData = myData as BookletData;
            this.tcs.rootTestlet = this.getBookletFromXml(bookletData.xml);

            if (this.tcs.rootTestlet === null) {
              this.mds.globalErrorMsg$.next(new ServerError(0, 'Error Parsing Booklet Xml', ''));
            } else {
              this.mds.globalErrorMsg$.next(null);
              this.tcs.numberOfUnits = this.lastUnitSequenceId - 1;

              const myUnitLoadings = [];
              for (let i = 1; i < this.tcs.numberOfUnits + 1; i++) {
                myUnitLoadings.push(this.loadUnitOk(this.tcs.rootTestlet.getUnitAt(i).unitDef, i));
              }
              forkJoin(myUnitLoadings).subscribe(allOk => {
                console.log('# yo hm');
                console.log(allOk);
              });
            }
          }
        });
      }
    });
  }

  // private updateStatus() {
  //   const cu = this.tcs.currentUnitPos$.getValue();
  //   if (cu >= 0) {
  //     this.statusMsg = '';
  //   } else {
  //     if (this.allUnits.length === 0) {
  //       this.statusMsg = 'Es stehen keine Informationen über ein gewähltes Testheft zur Verfügung.';
  //     } else {
  //       let allLocked = true;
  //       for (let i = 0; i < this.allUnits.length; i++) {
  //         if (!this.allUnits[i].locked) {
  //           allLocked = false;
  //           break;
  //         }
  //       }
  //       if (allLocked) {
  //         this.statusMsg = 'Alle Aufgaben sind für die Bearbeitung gesperrt. Der Test kann nicht fortgesetzt werden.';
  //       } else {
  //         this.statusMsg = 'Bitte wählen Sie links eine Aufgabe!';
  //       }
  //     }
  //   }
  //   this.showUnitComponent = this.statusMsg.length === 0;
  // }









  // goToUnitByPosition(pos: number) {
  //   const myBooklet = this.booklet$.getValue();
  //   if (myBooklet !== null) {
  //     const unitCount = myBooklet.units.length;
  //     if ((pos >= 0 ) && (pos < unitCount)) {
  //       this.router.navigateByUrl('/t/u/' + pos.toString());
  //     }
  //   }
  // }

  // setCurrentUnit(targetUnitSequenceId: number) {
  //   const currentBooklet = this.booklet$.getValue();
  //   if ((targetUnitSequenceId >= 0) && (currentBooklet !== null) && (targetUnitSequenceId < currentBooklet.units.length)) {
  //     this.currentUnitPos$.next(targetUnitSequenceId);

  //     // this.bs.setBookletStatus(this.lds.personToken$.getValue(),
  //     // this.lds.bookletDbId$.getValue(), {u: targetUnitSequenceId}).subscribe();
  //   }
  // }


  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  ngOnDestroy() {
    // if (this.unitPosSubsription !== null) {
    //   this.unitPosSubsription.unsubscribe();
    // }
    if (this.loginDataSubscription !== null) {
      this.loginDataSubscription.unsubscribe();
    }
  }
}
