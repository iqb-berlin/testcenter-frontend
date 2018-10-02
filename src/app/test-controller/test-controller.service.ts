import { Router } from '@angular/router';
import { LogindataService, Authorisation } from './../logindata.service';
import { BehaviorSubject, of, Observable, forkJoin, merge } from 'rxjs';
import { Injectable } from '@angular/core';
import { debounceTime, bufferTime, switchMap, map } from 'rxjs/operators';
import { BackendService, BookletData, UnitData } from './backend.service';
import { ServerError} from './../backend.service';

@Injectable({
  providedIn: 'root'
})
export class TestControllerService {
  // observed only by app.components for the page header
  public pageTitle$ = new BehaviorSubject<string>('Lade Seite...');

  public booklet$ = new BehaviorSubject<BookletDef>(null);
  public currentUnitPos$ = new BehaviorSubject<number>(-1);

  // for Navi-Buttons:
  public canReview$ = new BehaviorSubject<boolean>(false);
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
    private router: Router,
    private lds: LogindataService
  ) {
    merge(
      this.lds.loginMode$,
      this.lds.bookletDbId$
    ).subscribe(k => {
      const mode = this.lds.loginMode$.getValue();
      if ((mode === 'trial') || (mode === 'review')) {
        this.canReview$.next(this.lds.bookletDbId$.getValue() > 0);
      } else {
        this.canReview$.next(false);
      }
    });

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
  loadItemplayerOk(auth: Authorisation, unitDefinitionType: string): Observable<boolean> {
    unitDefinitionType = this.normaliseFileName(unitDefinitionType, 'html');
    if (this.itemplayers.hasOwnProperty(unitDefinitionType)) {
      return of(true);
    } else {
      // to avoid multiple calls before returning:
      this.itemplayers[unitDefinitionType] = null;
      return this.bs.getUnitResourceTxt(auth, unitDefinitionType)
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
      this.bs.setBookletStatus(this.lds.authorisation$.getValue(), {u: targetUnitSequenceId}).subscribe();
    }
  }
}

// [[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]]
export class SessionDataToSend {
  public readonly unitId: string;
  public response = '';
  public restorePoint$ = new BehaviorSubject<string>('');


  constructor (unitId: string) {
    this.unitId = unitId;
  }

}

export class BookletDef {
  id: string;
  label: string;
  units: UnitDef[];
  navibar: string;

  constructor(bdata: BookletData) {
    const oParser = new DOMParser();
    const oDOM = oParser.parseFromString(bdata.xml, 'text/xml');
    this.id = '??';
    this.label = '??';
    this.units = [];
    this.navibar = '';

    if (oDOM.documentElement.nodeName === 'Booklet') {
      // ________________________
      const metadataElements = oDOM.documentElement.getElementsByTagName('Metadata');
      if (metadataElements.length > 0) {
        const metadataElement = metadataElements[0];
        const IdElement = metadataElement.getElementsByTagName('Id')[0];
        this.id = IdElement.textContent;
        const LabelElement = metadataElement.getElementsByTagName('Label')[0];
        this.label = LabelElement.textContent;
      }

      // ________________________
      const unitsElements = oDOM.documentElement.getElementsByTagName('Units');
      if (unitsElements.length > 0) {
        const unitsElement = unitsElements[0];
        const unitList = unitsElement.getElementsByTagName('Unit');
        for (let i = 0; i < unitList.length; i++) {
          this.units[i] = new UnitDef(unitList[i].getAttribute('id'), unitList[i].getAttribute('label'));
          this.units[i].sequenceId = i;
        }
      }
    }
  }

  loadUnits(bs: BackendService, tcs: TestControllerService, auth: Authorisation): Observable<boolean[]> {
    const myUnitLoadings = [];
    for (let i = 0; i < this.units.length; i++) {
      myUnitLoadings.push(this.units[i].loadOk(bs, tcs, auth));
    }
    return forkJoin(myUnitLoadings);
  }

  getUnitAt(pos: number): UnitDef {
    if ((this.units.length > 0) && (pos < this.units.length)) {
      return this.units[pos];
    } else {
      return null;
    }
  }

  unlockedUnitCount(): number {
    let myCount = 0;
    for (let i = 0; i < this.units.length; i++) {
      if (!this.units[i].locked) {
        myCount += 1;
      }
    }
    return myCount;
  }
}

// .....................................................................
export class ResourceData {
  filename: string;
  id: string;
  type: string;
  dataString: string;

  constructor(filename: string, id: string) {
    if ((typeof filename === 'undefined') || (filename == null)) {
      filename = '';
    }
    if ((typeof id === 'undefined') || (id == null)) {
      id = '';
    }

    if ((filename + id).length === 0) {
      this.filename = '?';
      this.id = '?';
    } else {
      if (filename.length === 0) {
        this.filename = id;
      } else {
        this.filename = filename;
      }
      if (id.length === 0) {
        this.id = filename;
      } else {
        this.id = id;
      }
    }
  }
}


// .....................................................................
export class UnitDef {
  sequenceId: number;
  id: string;
  locked: boolean;
  label: string;
  resources: ResourceData[];
  restorePoint: string;
  unitDefinition: string;
  unitDefinitionType: string;

  constructor(unit_id: string, unit_label: string) {
    this.id = unit_id;
    this.label = unit_label;
    this.resources = [];
    this.restorePoint = '';
    this.unitDefinition = '';
    this.unitDefinitionType = '';
    this.locked = true;
    this.sequenceId = 0;
  }

  getResourcesAsDictionary(): {[resourceID: string]: string} {
    const myResources = {};
    for (let i = 0; i < this.resources.length; i++) {
      myResources[this.resources[i].id] = this.resources[i].dataString;
    }
    return myResources;
  }

  loadOk(bs: BackendService, tcs: TestControllerService, auth: Authorisation): Observable<boolean> {
    return bs.getUnitData(auth, this.id)
      .pipe(
        switchMap(myData => {
          if (myData instanceof ServerError) {
            const e = myData as ServerError;
            this.label = e.code.toString() + ': ' + e.labelNice;
            return of(false);
          } else {
            const myUnitData = myData as UnitData;
            if (myUnitData.restorepoint.length > 0) {
              this.restorePoint = JSON.parse(myUnitData.restorepoint);
            }
            const oParser = new DOMParser();
            const oDOM = oParser.parseFromString(myUnitData.xml, 'text/xml');

            if (oDOM.documentElement.nodeName === 'Unit') {
              // ________________________
              let definitionRef = '';
              const defElements = oDOM.documentElement.getElementsByTagName('Definition');

              if (defElements.length > 0) {
                const defElement = defElements[0];
                this.unitDefinition = defElement.textContent;
                this.unitDefinitionType = defElement.getAttribute('type');
              } else {
                const defRefElements = oDOM.documentElement.getElementsByTagName('DefinitionRef');

                if (defRefElements.length > 0) {
                  const defRefElement = defRefElements[0];
                  definitionRef = defRefElement.textContent;
                  this.unitDefinition = '';
                  this.unitDefinitionType = defRefElement.getAttribute('type');
                }
              }
              if (this.unitDefinitionType.length > 0) {

                return tcs.loadItemplayerOk(auth, this.unitDefinitionType).pipe(
                  switchMap(ok => {
                    if (ok && definitionRef.length > 0) {
                      return bs.getUnitResourceTxt(auth, definitionRef).pipe(
                        switchMap(def => {
                          if (def instanceof ServerError) {
                            return of(false);
                          } else {
                            this.unitDefinition = def as string;
                            this.locked = false;
                            return of(true);
                          }
                        }));
                    } else {
                      return of(this.locked = !ok);
                    }
                  }));
              } else {
                this.label = 'unitdef not found';
                return of(false); // Def-Element required
              }
            } else {
              return of(false);
            }
          }
        })
      );
  }
}

