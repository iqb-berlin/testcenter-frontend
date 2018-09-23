import { Router } from '@angular/router';
import { Authorisation } from './backend.service';
import { LogindataService } from './../logindata.service';
import { BehaviorSubject, of, Observable, forkJoin, merge } from 'rxjs';
import { Injectable } from '@angular/core';
import { debounceTime, bufferTime, switchMap, map } from 'rxjs/operators';
import { BackendService, BookletData, ServerError, UnitData } from './backend.service';

@Injectable({
  providedIn: 'root'
})
export class TestControllerService {
  // observed only by app.components for the page header
  public pageTitle$ = new BehaviorSubject<string>('Lade Seite...');

  public authorisation$ = new BehaviorSubject<Authorisation>(null);
  public booklet$ = new BehaviorSubject<BookletDef>(null);
  public currentUnit$ = new BehaviorSubject<UnitDef>(null);

  // for Navi-Buttons:
  public isReviewMode$ = new BehaviorSubject<boolean>(false);
  public showNaviButtons$ = new BehaviorSubject<boolean>(false);
  public itemplayerValidPages$ = new BehaviorSubject<string[]>([]);
  public itemplayerCurrentPage$ = new BehaviorSubject<string>('');
  public nextUnit$ = new BehaviorSubject<string>('');
  public prevUnit$ = new BehaviorSubject<string>('');
  public unitRequest$ = new BehaviorSubject<string>('');
  public canLeaveTest$ = new BehaviorSubject<boolean>(false);
  public itemplayerPageRequest$ = new BehaviorSubject<string>('');

  // ))))))))))))))))))))))))))))))))))))))))))))))))
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
    this.lds.personToken$.subscribe(pt => {
      const b = this.lds.bookletDbId$.getValue();
      if ((pt.length > 0) && (b > 0)) {
        this.authorisation$.next(Authorisation.fromPersonTokenAndBookletId(pt, b));
      } else {
        this.authorisation$.next(null);

        this.booklet$.next(null);
        this.currentUnit$.next(null);
        this.showNaviButtons$.next(false);
        this.itemplayerValidPages$.next([]);
        this.itemplayerCurrentPage$.next('');
        this.nextUnit$.next('');
        this.prevUnit$.next('');
        this.unitRequest$.next('');
        this.canLeaveTest$.next(false);
        this.itemplayerPageRequest$.next('');
      }
    });
    merge(
      this.lds.loginMode$,
      this.lds.bookletDbId$
    ).subscribe(k => {
      const mode = this.lds.loginMode$.getValue();
      if ((mode === 'trial') || (mode === 'review')) {
        this.isReviewMode$.next(this.lds.bookletDbId$.getValue() > 0);
      } else {
        this.isReviewMode$.next(false);
      }
    });
  }

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

  goToUnitByPosition(pos) {
    const myBooklet = this.booklet$.getValue();
    if (myBooklet !== null) {
      this.router.navigateByUrl('/t/u/' + pos);
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

  loadUnits(bs: BackendService, auth: Authorisation): Observable<boolean[]> {
    const myUnitLoadings = [];
    for (let i = 0; i < this.units.length; i++) {
      myUnitLoadings.push(this.units[i].loadOk(bs, auth));
    }
    return forkJoin(myUnitLoadings);
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
  dbId: number;
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

  loadOk(bs: BackendService, auth: Authorisation): Observable<boolean> {
    return bs.getUnit(auth, this.id)
      .pipe(
        switchMap(myData => {
          if (myData instanceof ServerError) {
            const e = myData as ServerError;
            this.label = e.code.toString() + ': ' + e.label;
            return of(false);
          } else {
            const myUnitData = myData as UnitData;
            const oParser = new DOMParser();
            const oDOM = oParser.parseFromString(myUnitData.xml, 'text/xml');

            if (oDOM.documentElement.nodeName === 'Unit') {
              // ________________________
              const defElements = oDOM.documentElement.getElementsByTagName('Definition');
              if (defElements.length > 0) {
                const defElement = defElements[0];
                this.unitDefinition = defElement.textContent;
                this.unitDefinitionType = defElement.getAttribute('type');

                return bs.loadItemplayerOk(auth, this.unitDefinitionType).pipe(
                  map(ok => this.locked = !ok));
                // ________________________
                // const resourcesElements = oDOM.documentElement.getElementsByTagName('Resources');
                // if (resourcesElements.length > 0) {
                  // const resourcesElement = resourcesElements[0];
                  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
                  //
                  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
                // }
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

