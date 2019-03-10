import { BehaviorSubject, of, Observable, Subject } from 'rxjs';
import { Injectable } from '@angular/core';
import { Testlet, BookletConfig } from './test-controller.classes';
import { LastStateKey, LogEntryKey } from './test-controller.interfaces';
import { BackendService } from './backend.service';
import { JsonpInterceptor } from '@angular/common/http';
import { ServerError } from '../backend.service';

@Injectable({
  providedIn: 'root'
})
export class TestControllerService {
  private standardBookletConfig: BookletConfig = {
    showMainNaviButtons: true
  };
  public bookletConfig$ = new BehaviorSubject<BookletConfig>(this.standardBookletConfig);
  public rootTestlet: Testlet = null;
  public bookletDbId = 0;
  public numberOfUnits = 0;
  public loginname = '';
  public mode = '';

  public navigationRequest$ = new Subject<string>();

  private _currentUnitSequenceId: number;
  public get currentUnitSequenceId(): number {
    return this._currentUnitSequenceId;
  }
  public set currentUnitSequenceId(v: number) {
    this.unitPrevEnabled = v > 1;
    this.unitNextEnabled = v < this.numberOfUnits;
    this._currentUnitSequenceId = v;
  }

  public currentUnitDbKey = '';
  public currentUnitTitle = '';
  public unitPrevEnabled = false;
  public unitNextEnabled = false;

  // public booklet$ = new BehaviorSubject<BookletDef>(null);

  // for Navi-Buttons:
  // public showNaviButtons$ = new BehaviorSubject<boolean>(false);
  // public nextUnit$ = new BehaviorSubject<number>(-1);
  // public prevUnit$ = new BehaviorSubject<number>(-1);
  // public unitRequest$ = new BehaviorSubject<number>(-1);
  // public canLeaveTest$ = new BehaviorSubject<boolean>(false);

  // ))))))))))))))))))))))))))))))))))))))))))))))))

  private players: {[filename: string]: string} = {};
  private unitDefinitions: {[sequenceId: number]: string} = {};
  private unitRestorePoints: {[sequenceId: number]: string} = {};

  constructor (
    private bs: BackendService
  ) { }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  public resetDataStore() {
    this.bookletConfig$.next(this.standardBookletConfig);
    this.bookletDbId = 0;
    this.players = {};
    this.unitDefinitions = {};
    this.unitRestorePoints = {};
    this.rootTestlet = null;
    this.numberOfUnits = 0;
    this.mode = '';
    this.loginname = '';
    this.currentUnitSequenceId = 0;
    this.currentUnitDbKey = '';
    this.currentUnitTitle = '';
    this.unitPrevEnabled = false;
    this.unitNextEnabled = false;
  }



  // public unitname$ = new BehaviorSubject<string>('-');
  // private saveToBackend$: Observable<string>;
  //
  // private _currentUnitId = '';

  // // .................................................................................
  // private currentUnitId$ = new BehaviorSubject<number>(0);
  // public isSession$ = new BehaviorSubject<boolean>(false);

  // get sessionToken(): string {
  //   return this._sessionToken;
  // }

  // constructor(
  //   private bs: BackendService,
  //   private router: Router
  // ) {
  //   this.currentUnitPos$.subscribe((p: number) => {
  //     const b = this.booklet$.getValue();
  //     if (b === null) {
  //       this.prevUnit$.next(-1);
  //       this.nextUnit$.next(-1);
  //     } else {
  //       if (p > 0) {
  //         this.prevUnit$.next(p - 1);
  //       } else {
  //         this.prevUnit$.next(-1);
  //       }
  //       const uCount = b.units.length;
  //       if (p < (uCount - 1)) {
  //         this.nextUnit$.next(p + 1);
  //       } else {
  //         this.nextUnit$.next(-1);
  //       }
  //     }
  //   });

  //   this.unitRequest$.subscribe(p => {
  //     this.goToUnitByPosition(p);
  //   });
  // }

  // 66666666666666666666666666666666666666666666666666666666666666666666666666
  // getUnitForPlayer(unitId): UnitDef {
  //   const myBooklet = this.booklet$.getValue();
  //   if (myBooklet === null) {
  //     return null;
  //   } else {
  //     for (let i = 0; i < myBooklet.units.length; i++) {
  //       if (myBooklet.units[i].id === unitId) {
  //         return myBooklet.units[i];
  //       }
  //     }
  //   }
  //   return null;
  // }


  // 7777777777777777777777777777777777777777777777777777777777777777777777
  // uppercase and add extension if not part
  public normaliseId(s: string, standardext = ''): string {
    s = s.trim().toUpperCase();
    s.replace(/\s/g, '_');
    if (standardext.length > 0) {
      standardext = standardext.trim().toUpperCase();
      standardext.replace(/\s/g, '_');
      standardext = '.' + standardext.replace('.', '');

      if (s.slice(-(standardext.length)) !== standardext) {
        s = s + standardext;
      }
    }
    return s;
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  public addPlayer (id: string, player: string) {
    this.players[this.normaliseId(id, 'html')] = player;
  }
  public hasPlayer (id: string): boolean {
    return this.players.hasOwnProperty(this.normaliseId(id, 'html'));
  }
  public getPlayer(id: string): string {
    return this.players[this.normaliseId(id, 'html')];
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  public addUnitDefinition (sequenceId: number, uDef: string) {
    this.unitDefinitions[sequenceId] = uDef;
  }
  public hasUnitDefinition (sequenceId: number): boolean {
    return this.unitDefinitions.hasOwnProperty(sequenceId);
  }
  public getUnitDefinition(sequenceId: number): string {
    return this.unitDefinitions[sequenceId];
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  // adding RestorePoint via newUnitRestorePoint below
  public hasUnitRestorePoint (sequenceId: number): boolean {
    return this.unitRestorePoints.hasOwnProperty(sequenceId);
  }
  public getUnitRestorePoint(sequenceId: number): string {
    return this.unitRestorePoints[sequenceId];
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  public setUnitNavigationRequest(RequestKey: string) {
    this.navigationRequest$.next(RequestKey);
  }


  // 7777777777777777777777777777777777777777777777777777777777777777777777
  public addBookletLog(logKey: LogEntryKey, entry = '') {
    this.bs.addBookletLog(this.bookletDbId, Date.now(),
            entry.length > 0 ? logKey + ': ' + JSON.stringify(entry) : logKey).subscribe(ok => {
      if (ok instanceof ServerError) {
        console.log('((((((((((((((((addBookletLog');
      }
    });
  }
  public setBookletState(stateKey: LastStateKey, state: string) {
    this.bs.setBookletState(this.bookletDbId, stateKey, state).subscribe(ok => {
      if (ok instanceof ServerError) {
        console.log('((((((((((((((((setBookletState');
      }
    });
  }
  public addUnitLog(unitDbKey: string, logKey: LogEntryKey, entry = '') {
    this.bs.addUnitLog(this.bookletDbId, Date.now(), unitDbKey,
            entry.length > 0 ? logKey + ': ' + JSON.stringify(entry) : logKey).subscribe(ok => {
      if (ok instanceof ServerError) {
        console.log('((((((((((((((((addUnitLog');
      }
    });
  }
  public newUnitResponse(unitDbKey: string, response: string, responseType) {
    this.bs.newUnitResponse(this.bookletDbId, Date.now(), unitDbKey, JSON.stringify(response), responseType).subscribe(ok => {
      if (ok instanceof ServerError) {
        console.log('((((((((((((((((newUnitResponse');
      }
    });
  }
  public newUnitRestorePoint(unitDbKey: string, unitSequenceId: number, restorePoint: string, postToServer: boolean) {
    this.unitRestorePoints[unitSequenceId] = restorePoint;
    if (postToServer) {
      this.bs.newUnitRestorePoint(this.bookletDbId, unitDbKey, Date.now(), JSON.stringify(restorePoint)).subscribe(ok => {
        if (ok instanceof ServerError) {
          console.log('((((((((((((((((newUnitRestorePoint');
        }
      });
    }
  }


  // -- -- -- -- -- -- -- -- -- -- -- -- -- --
      // this.log$.pipe(
      //   bufferTime(500)
      // ).subscribe((data: UnitLogData[]) => {
      //   if (data.length > 0) {
      //     const myLogs = {};
      //     data.forEach(lg => {
      //       if (lg !== null) {
      //         if (lg.logEntry.length > 0) {
      //           if (typeof myLogs[lg.unitDbKey] === 'undefined') {
      //             myLogs[lg.unitDbKey] = [];
      //           }
      //           myLogs[lg.unitDbKey].push(JSON.stringify(lg.logEntry));
      //         }
      //       }
      //     });
      //     for (const unitName in myLogs) {
      //       if (myLogs[unitName].length > 0) {
      //         // ## this.bs.setUnitLog(this.lds.personToken$.getValue(),
      //         // this.lds.bookletDbId$.getValue(), unitName, myLogs[unitName]).subscribe();
      //       }
      //     }
      //   }
      // });

}
