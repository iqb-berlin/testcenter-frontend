import { BehaviorSubject, of, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Testlet, BookletConfig } from './test-controller.classes';

@Injectable({
  providedIn: 'root'
})
export class TestControllerService {
  private standardBookletConfig: BookletConfig = {
    showMainNaviButtons: true
  };
  public bookletConfig$ = new BehaviorSubject<BookletConfig>(this.standardBookletConfig);
  public rootTestlet: Testlet = null;
  public numberOfUnits = 0;
  public loginname = '';
  public mode = '';

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

  public resetDataStore() {
    this.bookletConfig$.next(this.standardBookletConfig);
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
  public addUnitRestorePoint (sequenceId: number, uRP: string) {
    this.unitRestorePoints[sequenceId] = uRP;
  }
  public hasUnitRestorePoint (sequenceId: number): boolean {
    return this.unitRestorePoints.hasOwnProperty(sequenceId);
  }
  public getUnitRestorePoint(sequenceId: number): string {
    return this.unitRestorePoints[sequenceId];
  }
}
