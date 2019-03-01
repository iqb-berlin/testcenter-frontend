import { Router } from '@angular/router';
import { BehaviorSubject, of, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { BackendService } from './backend.service';
import { ServerError} from '../backend.service';
import { UnitDef, BookletDef } from './test-controller.classes';

@Injectable({
  providedIn: 'root'
})
export class TestControllerService {
  public booklet$ = new BehaviorSubject<BookletDef>(null);
  public currentUnitPos$ = new BehaviorSubject<number>(-1);
  public mode = '';

  // for Navi-Buttons:
  public showNaviButtons$ = new BehaviorSubject<boolean>(false);
  public itemplayerValidPages$ = new BehaviorSubject<string[]>([]);
  public itemplayerCurrentPage$ = new BehaviorSubject<string>('');
  public nextUnit$ = new BehaviorSubject<number>(-1);
  public prevUnit$ = new BehaviorSubject<number>(-1);
  public unitRequest$ = new BehaviorSubject<number>(-1);
  public canLeaveTest$ = new BehaviorSubject<boolean>(false);
  public itemplayerPageRequest$ = new BehaviorSubject<string>('');

  // ))))))))))))))))))))))))))))))))))))))))))))))))
  // buffering itemplayers

  private itemplayers: {[filename: string]: string} = {};



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

  constructor(
    private bs: BackendService,
    private router: Router
  ) {
    this.currentUnitPos$.subscribe((p: number) => {
      const b = this.booklet$.getValue();
      if (b === null) {
        this.prevUnit$.next(-1);
        this.nextUnit$.next(-1);
      } else {
        if (p > 0) {
          this.prevUnit$.next(p - 1);
        } else {
          this.prevUnit$.next(-1);
        }
        const uCount = b.units.length;
        if (p < (uCount - 1)) {
          this.nextUnit$.next(p + 1);
        } else {
          this.nextUnit$.next(-1);
        }
      }
    });

    this.unitRequest$.subscribe(p => {
      this.goToUnitByPosition(p);
    });
  }

  // 66666666666666666666666666666666666666666666666666666666666666666666666666
  getUnitForPlayer(unitId): UnitDef {
    const myBooklet = this.booklet$.getValue();
    if (myBooklet === null) {
      return null;
    } else {
      for (let i = 0; i < myBooklet.units.length; i++) {
        if (myBooklet.units[i].id === unitId) {
          return myBooklet.units[i];
        }
      }
    }
    return null;
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  loadItemplayerOk(pToken: string, bookletDbId: number, unitDefinitionType: string): Observable<boolean> {
    unitDefinitionType = this.normaliseFileName(unitDefinitionType, 'html');
    if (this.itemplayers.hasOwnProperty(unitDefinitionType)) {
      return of(true);
    } else {
      // to avoid multiple calls before returning:
      this.itemplayers[unitDefinitionType] = null;
      return this.bs.getResource(unitDefinitionType)
          .pipe(
            switchMap(myData => {
              if (myData instanceof ServerError) {
                return of(false);
              } else {
                const itemplayerData = myData as string;
                if (itemplayerData.length > 0) {
                  this.itemplayers[unitDefinitionType] = itemplayerData;
                  return of(true);
                } else {
                  return of(false);
                }
              }
            }));
    }
  }

  // uppercase and add extension if not part
  private normaliseFileName(fn: string, ext: string): string {
    fn = fn.toUpperCase();
    ext = ext.toUpperCase();
    if (ext.slice(0, 1) !== '.') {
      ext = '.' + ext;
    }

    if (fn.slice(-(ext.length)) === ext) {
      return fn;
    } else {
      return fn + ext;
    }
  }

  // 7777777777777777777777777777777777777777777777777777777777777777777777
  getItemplayer(unitDefinitionType: string): string {
    unitDefinitionType = this.normaliseFileName(unitDefinitionType, 'html');
    if ((unitDefinitionType.length > 0) && this.itemplayers.hasOwnProperty(unitDefinitionType)) {
      return this.itemplayers[unitDefinitionType];
    } else {
      return '';
    }
  }


  goToUnitByPosition(pos: number) {
    const myBooklet = this.booklet$.getValue();
    if (myBooklet !== null) {
      const unitCount = myBooklet.units.length;
      if ((pos >= 0 ) && (pos < unitCount)) {
        this.router.navigateByUrl('/t/u/' + pos.toString());
      }
    }
  }

  setCurrentUnit(targetUnitSequenceId: number) {
    const currentBooklet = this.booklet$.getValue();
    if ((targetUnitSequenceId >= 0) && (currentBooklet !== null) && (targetUnitSequenceId < currentBooklet.units.length)) {
      this.currentUnitPos$.next(targetUnitSequenceId);

      // this.bs.setBookletStatus(this.lds.personToken$.getValue(),
      // this.lds.bookletDbId$.getValue(), {u: targetUnitSequenceId}).subscribe();
    }
  }
}
