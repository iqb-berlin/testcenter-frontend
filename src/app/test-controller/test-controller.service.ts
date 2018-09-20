import { LogindataService } from './../logindata.service';
import { BehaviorSubject, of, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { debounceTime, bufferTime } from 'rxjs/operators';
import { BackendService, ServerError } from './backend.service';

@Injectable({
  providedIn: 'root'
})
export class TestControllerService {
  // observed only by app.components for the page header
  public pageTitle$ = new BehaviorSubject<string>('Lade Seite...');


  public isReviewMode$ = new BehaviorSubject<boolean>(true);
  public canLeaveTest$ = new BehaviorSubject<boolean>(false);

  // ))))))))))))))))))))))))))))))))))))))))))))))))

  public currentValidPages: string[] = [];
  private unitRestorePoints = {};
  private itemplayers = {};

  // changed by itemplayer via postMessage, observed here to save (see below)
  public restorePoint$ = new BehaviorSubject<string>('');
  public response$ = new BehaviorSubject<string>('');
  public log$ = new BehaviorSubject<string>('');

  // ??
  public unitname$ = new BehaviorSubject<string>('-');

  private saveToBackend$: Observable<string>;

  public showNaviButtons$ = new BehaviorSubject<boolean>(false);
  public itemplayerPageRequest$ = new BehaviorSubject<string>('');
  public itemplayerCurrentPage$ = new BehaviorSubject<string>('');
  public itemplayerValidPages$ = new BehaviorSubject<string[]>([]);
  public nextUnit$ = new BehaviorSubject<string>('');
  public prevUnit$ = new BehaviorSubject<string>('');
  public unitRequest$ = new BehaviorSubject<string>('');

  private _currentUnitId = '';

  // .................................................................................
  private allUnits: UnitDef[] = [];
  private currentUnitId$ = new BehaviorSubject<number>(0);
  public isSession$ = new BehaviorSubject<boolean>(false);

  // get sessionToken(): string {
  //   return this._sessionToken;
  // }

  constructor(
    private bs: BackendService,
    private lds: LogindataService
  ) {
    this.restorePoint$.pipe(
      debounceTime(1000)
    ).subscribe(data => this.bs.setUnitRestorePoint(this.lds.personToken$.getValue(), this._currentUnitId, data));

    this.response$.pipe(
      debounceTime(1000)
    ).subscribe(data => this.bs.setUnitResponses(this.lds.personToken$.getValue(), this._currentUnitId, data));

    this.log$.pipe(
      bufferTime(1000)
    ).subscribe(data => this.bs.setUnitLog(this.lds.personToken$.getValue(), this._currentUnitId, data));
  }

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

  // ================================================================
  public digestItemplayerData(playerData) {
  }

  updateUnitId(newUnitId: number) {}
  fetchUnitData (myUnit: UnitDef): Observable<UnitDef> {
    return of(null);
  }
  getUnitAt (unitId: any): Observable<UnitDef | ServerError> {
    return of(null);
  }
}

export class SessionDataToSend {
  public readonly unitId: string;
  public response = '';
  public restorePoint$ = new BehaviorSubject<string>('');


  constructor (unitId: string) {
    this.unitId = unitId;
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
  name: string;
  title: string;
  resources: ResourceData[];
  restorePoint: string;
  unitDefinition: string;
  itemplayerId: string;

  constructor(name: string, title: string) {
    this.name = name;
    this.title = title;
    this.resources = [];
    this.restorePoint = '';
    this.unitDefinition = '';
    this.itemplayerId = '';
  }

  getItemplayerHtml() {
    for (let i = 0; i < this.resources.length; i++) {
      if (this.resources[i].type === 'itemplayer_html') {
        if (this.resources[i].dataString.length > 0) {
          return this.resources[i].dataString;
        }
      }
    }
    return null;
  }

  getResourcesAsDictionary(): {[resourceID: string]: string} {
    const myResources = {};
    for (let i = 0; i < this.resources.length; i++) {
      if (this.resources[i].type !== 'itemplayer_html') {
        myResources[this.resources[i].id] = this.resources[i].dataString;
      }
    }
    return myResources;
  }
}

