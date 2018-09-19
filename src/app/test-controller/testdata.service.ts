import { BehaviorSubject ,  Observable, Subject } from 'rxjs';
import { BackendService, SessionData, UnitData, ServerError } from './backend.service';
import { Injectable, Component, Input, Output, EventEmitter, Pipe } from '@angular/core';
import { Element } from '@angular/compiler';
import { mergeAll, switchMap, map } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class TestdataService {
  public isSession$ = new BehaviorSubject<boolean>(false);
  public statusmessage$ = new BehaviorSubject<string>('Bitte warten!');
  public bookletname$ = new BehaviorSubject<string>('-');
  public unitname$ = new BehaviorSubject<string>('-');
  public pendingItemDefinition$ = new BehaviorSubject<string>('');
  public pendingItemRestorePoint$ = new BehaviorSubject<string>('');
  public pendingItemResources$ = new BehaviorSubject<{[resourceID: string]: string}>(null);

  public postMessage$ = new Subject<MessageEvent>();

  public restorePoint$ = new BehaviorSubject<string>('');
  public response$ = new BehaviorSubject<string>('');
  public log$ = new BehaviorSubject<string>('');
  private itemplayers = {};
  private unitRestorePoints = {};



  // ccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
  constructor(
    private bs: BackendService,
    private router: Router
  ) {
/*    this._sessionToken = localStorage.getItem('st');
    if (this._sessionToken === null) {
      this._sessionToken = '';
    }
    if (this._sessionToken === '') {
      this.isSession$.next(false);
    } else {
      this.isSession$.next(true);
    }

    this.currentUnitId$.subscribe(myUnitId => {
      this.navPrevEnabled$.next(myUnitId > 0);
      this.navNextEnabled$.next((myUnitId >= 0) && (myUnitId < this.allUnits.length - 1));
    });

    this.postMessage$.subscribe(postData => {
      const msgData = postData.data;
      const msgType = msgData['type'];
      if ((msgType !== undefined) || (msgType !== null)) {
        if (msgType.substr(0, 7) === 'OpenCBA') {
          // .........................................
          const targetWindow = postData.source;
          if (msgType == 'OpenCBA.newData') {
            const responseData = playerData['newResponses'];
            if ((responseData !== undefined) || (responseData !== null)) {
              this.response$.next(responseData);
              // this.bs.setUnitResponses(this.sessionToken, this.unitname$.getValue(), responseData)
              // .subscribe();
            }

            const restoreData = playerData['newRestorePoint'];
            if ((restoreData !== undefined) || (restoreData !== null)) {
              this.restorePoint$.next(restoreData);
              // this.bs.setUnitRestorePoint(this.sessionToken, this.unitname$.getValue(), restoreData)
              // .subscribe();
            }

            const logData = playerData['newLogEntry'];
            if ((logData !== undefined) || (logData !== null)) {
              this.log$.next(logData);
              // this.bs.setUnitLog(this.sessionToken, this.unitname$.getValue(), logData)
              // .subscribe();
            }
          }

    })*/
/*    this.isSession$.subscribe(isSession => {
      if (isSession) {

      } else {
        this.updateBookletData('?', [], '', '');
      }
    }); */
  }
/*
  // -----------------------------------------------------------------
  public addItemPlayer(playerid: string, player: string) {
    this.itemplayers[playerid] = player;
  }

  // -----------------------------------------------------------------
  public getItemPlayer(playerid: string) {
    if (this.itemplayers.hasOwnProperty(playerid)) {
      return this.itemplayers[playerid];
    } else {
      return '';
    }
  }

  // -----------------------------------------------------------------
  public addUnitRestorePoint(unitId: string, restPoint: string) {
    this.unitRestorePoints[unitId] = restPoint;
  }

  // -----------------------------------------------------------------
  public getUnitRestorePoint(unitId: string) {
    if (this.unitRestorePoints.hasOwnProperty(unitId)) {
      return this.unitRestorePoints[unitId];
    } else {
      return '';
    }
  }

  getUnitAt (unitId: any): Observable<UnitDef | ServerError> {
    const unitIdNumber = Number(unitId);
    if (Number.isNaN(unitId) || (unitId < 0)) {
      return new Observable(observer => {
        observer.next(null);
        observer.complete();
      });
    } else {
      if (this.allUnits.length === 0) {

        // first call at the beginning of test -> get booklet
        return this.bs.getSessionData(this.sessionToken)
          .pipe(
            map((bdata: SessionData) => {

            let myBookletName = '';

            // Create Unit-List
            const oParser = new DOMParser();
            const oDOM = oParser.parseFromString(bdata.xml, 'text/xml');
            if (oDOM.documentElement.nodeName === 'Booklet') {
              // ________________________
              const metadataElements = oDOM.documentElement.getElementsByTagName('Metadata');
              if (metadataElements.length > 0) {
                const metadataElement = metadataElements[0];
                const NameElement = metadataElement.getElementsByTagName('Name')[0];
                myBookletName = NameElement.textContent;
              }

              // ________________________
              const unitsElements = oDOM.documentElement.getElementsByTagName('Units');
              if (unitsElements.length > 0) {
                const unitsElement = unitsElements[0];
                const unitList = unitsElement.getElementsByTagName('Unit');
                for (let i = 0; i < unitList.length; i++) {
                  this.allUnits[i] = new UnitDef(unitList[i].getAttribute('name'), unitList[i].getAttribute('title'));
                  this.allUnits[i].sequenceId = i;
                }
              }
            }
            return this.allUnits[unitId];
          }));
        } else {
            // this.updateBookletData(myBookletName, myUnits, 'Bitte warten', bdata.status);
        // }, (err: ServerError) => {
            // this.updateBookletData('?', [], err.label, '');
          return new Observable(observer => {
            observer.next(this.allUnits[unitId]);
            observer.complete();
          });
      }
    }
  }

  // switchMap because current requests have to cancelled if new fetchUnitData-call arrives
  fetchUnitData (myUnit: UnitDef): Observable<UnitDef> {
    if (myUnit === null) {
      return new Observable(observer => {
        observer.next(null);
        observer.complete();
      });
    } else {

      return this.bs.getUnit(this.sessionToken, myUnit.name)
        .pipe(
          switchMap((udata: UnitData) => {
            myUnit.restorePoint = udata.restorepoint;

            const oParser = new DOMParser();
            const oDOM = oParser.parseFromString(udata.xml, 'text/xml');
            if (oDOM.documentElement.nodeName === 'Unit') {
              // ________________________
              const dataElements = oDOM.documentElement.getElementsByTagName('Data');
              if (dataElements.length > 0) {
                const dataElement = dataElements[0];
                myUnit.dataForItemplayer = dataElement.textContent;
              }

              // ________________________
              const resourcesElements = oDOM.documentElement.getElementsByTagName('Resources');
              if (resourcesElements.length > 0) {
                let ResourceFetchPromises: Promise<number>[];
                ResourceFetchPromises = [];

                // resources ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                const resourcesElement = resourcesElements[0];
                const rList = resourcesElement.getElementsByTagName('Resource');
                for (let i = 0; i < rList.length; i++) {
                  const myResource = new ResourceData(rList[i].textContent, rList[i].getAttribute('id'));
                  myResource.type = rList[i].getAttribute('type');
                  myUnit.resources.push(myResource);

                  // prepare promise for each resource loading
                  if (myResource.type === 'itemplayer_html') {
                    ResourceFetchPromises.push(new Promise((resolve, reject) => {
                      this.bs.getUnitResourceTxt(this.sessionToken, myResource.filename).subscribe(
                        (fileAsTxt: string) => {
                          myResource.dataString = fileAsTxt;
                          resolve(myResource.dataString.length);
                        }
                      );
                    }));
                  } else {
                    ResourceFetchPromises.push(new Promise((resolve, reject) => {
                      this.bs.getUnitResource64(this.sessionToken, myResource.filename).subscribe(
                        (fileAsBase64: string) => {
                          myResource.dataString = fileAsBase64;
                          resolve(myResource.dataString.length);
                        }
                      );
                    }));
                  }
                }

                // run all promises (i. e. resource loading requests)
                return Promise.all(ResourceFetchPromises)
                  .then(promisesReturnValues => {
                    this.bs.setBookletStatus(this.sessionToken, {u: myUnit.sequenceId})
                      .subscribe();
                    return myUnit;
                  });


              } else {
                return this.bs.setBookletStatus(this.sessionToken, {u: myUnit.sequenceId})
                .pipe(
                  map(d => myUnit)
                );
              }
            } else {
              return null;
            }
          }));
        }
  }

  // + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
  getUnitId(target: string): number {
    let myUnitId = this.currentUnitId$.getValue();

    if (this.allUnits.length > 0) {
      switch (target) {
        case 'next':
          if (myUnitId < this.allUnits.length - 1) {
            myUnitId = myUnitId + 1;
          }
          break;

        case 'prev':
          if (myUnitId > 0) {
            myUnitId = myUnitId - 1;
          }
          break;

        case 'first':
          myUnitId = 0;
          break;

        case 'last':
          myUnitId = this.allUnits.length - 1;
          break;

        default:
          myUnitId = -1;
          break;
      }
    } else {
      myUnitId = 0;
    }
    return myUnitId;
  }

  // + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
  public gotoPrevUnit() {
    this.gotoUnit(this.getUnitId('prev'));
  }

  // + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
  public gotoNextUnit() {
    this.gotoUnit(this.getUnitId('next'));
  }

  // + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
  public gotoFirstUnit(lastUnit?: number) {
    if (lastUnit == null) {
      this.gotoUnit(this.getUnitId('first'));
    } else {
      this.gotoUnit(lastUnit);
    }
  }

  // + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
  // + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
  private gotoUnit(newUnitId) {
    this.router.navigateByUrl('/t/u/' + newUnitId, { skipLocationChange: false });
  }

  // /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\
  processMessagePost(postData: MessageEvent) {
    const msgData = postData.data;
    const msgType = msgData['type'];
    if ((msgType !== undefined) || (msgType !== null)) {
      if (msgType.substr(0, 7) === 'OpenCBA') {
        this.postMessage$.next(postData);
      }
    }
  }

  // app.component.ngOnInit sets a listener on 'message'-event.
  processMessagePostX(postData: MessageEvent) {
    const msgData = postData.data;
    const msgType = msgData['type'];
    if ((msgType !== undefined) || (msgType !== null)) {
      if (msgType.substr(0, 7) === 'OpenCBA') {
        // .........................................
        const targetWindow = postData.source;
        switch (msgType) {

          // // // // // // //
          case 'OpenCBA.stateChanged':
            if (msgData['newState'] === 'readyToInitialize') {
              let hasData = false;
              const initParams = {};

              const pendingSpec = this.pendingItemDefinition$.getValue();
              if ((pendingSpec !== null) || (pendingSpec.length > 0)) {
                initParams['itemSpecification'] = pendingSpec;
                hasData = true;
                this.pendingItemDefinition$.next(null);
              }
              const pendingRes = this.pendingItemResources$.getValue();
              if ((pendingRes !== null) || (pendingRes !== {})) {
                initParams['itemResources'] = pendingRes;
                hasData = true;
                this.pendingItemResources$.next({});
              }
              const pendingRP = this.pendingItemRestorePoint$.getValue();
              if ((pendingRP !== null) || (pendingRP.length > 0)) {
                initParams['restorePoint'] = pendingRP;
                hasData = true;
                this.pendingItemRestorePoint$.next(null);
              }

              if (hasData) {
                targetWindow.postMessage({
                  type: 'OpenCBA.initItemPlayer',
                  initParameters: initParams
                }, '*');
              }
            }
            break;

          // // // // // // //
          case 'OpenCBA.newData':
            const responseData = msgData['newResponses'];
            if ((responseData !== undefined) || (responseData !== null)) {
              this.bs.setUnitResponses(this.sessionToken, this.unitname$.getValue(), responseData)
              .subscribe();
            }

            const restoreData = msgData['newRestorePoint'];
            if ((restoreData !== undefined) || (restoreData !== null)) {
              this.bs.setUnitRestorePoint(this.sessionToken, this.unitname$.getValue(), restoreData)
              .subscribe();
            }

            const logData = msgData['newLogEntry'];
            if ((restoreData !== undefined) || (restoreData !== null)) {
              this.bs.setUnitLog(this.sessionToken, this.unitname$.getValue(), logData)
              .subscribe();
            }

            break;

          // // // // // // //
          default:
            console.log('processMessagePost unknown message type: ' + msgType);
            break;
        }


        // .........................................
      }
    }
  }
  // /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\


  updateSessionToken(newToken: string) {
    this._sessionToken = newToken;
    if ((newToken !== null) && (newToken.length > 0)) {
      localStorage.setItem('st', newToken);
      this.isSession$.next(true);
    } else {
      localStorage.removeItem('st');
      this.isSession$.next(false);
    }
  }

  updateBookletData(bookletname: string, units: UnitDef[], message: string, status: {}) {
    this.allUnits = units;
    this.bookletname$.next(bookletname);
    this.statusmessage$.next(message);

    if ((status === null) || (status['u'] === undefined)) {
      this.gotoFirstUnit();
    } else {
      this.gotoUnit(status['u']);
    }
  }

  updatePageTitle(newTitle: string) {
    this.pageTitle$.next(newTitle);
  }

  updateUnitId(newUnitId: number) {
    if ((newUnitId >= 0) && (newUnitId < this.allUnits.length)) {
      this.currentUnitId$.next(newUnitId);
    } else {
      this.currentUnitId$.next(-1);
    }
  }*/
}



// .....................................................................
export class Testlet {
  private _testlets: Testlet[];
  private _units: string;
  constructor() {

  }

}

// .....................................................................
export interface NavigationPoint {
  title: string;
  unitId: number;
  path: string;
}

// .....................................................................
export class ResourceStore {

}

