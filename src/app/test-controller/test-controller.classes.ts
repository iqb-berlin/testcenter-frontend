import { BackendService } from './backend.service';
import { TestControllerService } from './test-controller.service';
import { Observable, of, BehaviorSubject, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UnitData, BookletData } from './test-controller.interfaces';

// .....................................................................
// .....................................................................
export class ServerError {
    public code: number;
    public labelNice: string;
    public labelSystem: string;
    constructor(code: number, labelNice: string, labelSystem) {
      this.code = code;
      this.labelNice = labelNice;
      this.labelSystem = labelSystem;
    }
}

// .....................................................................
// .....................................................................
export class UnitDef {
    sequenceId: number;
    id: string;
    locked: boolean;
    label: string;
    shortlabel: string;
    resources: ResourceData[];
    restorePoint: string;
    unitDefinition: string;
    unitDefinitionType: string;
    startLockKey: string;
    startLockPrompt: string;

    constructor(unit_id: string, unit_label: string) {
      this.id = unit_id;
      this.label = unit_label;
      const labelSplits = unit_label.split(' ');
      this.shortlabel = labelSplits[0];
      this.resources = [];
      this.restorePoint = '';
      this.unitDefinition = '';
      this.unitDefinitionType = '';
      this.locked = true;
      this.sequenceId = 0;
      this.startLockKey = '';
      this.startLockPrompt = '';
    }

    getResourcesAsDictionary(): {[resourceID: string]: string} {
      const myResources = {};
      for (let i = 0; i < this.resources.length; i++) {
        myResources[this.resources[i].id] = this.resources[i].dataString;
      }
      return myResources;
    }

    loadOk(bs: BackendService, tcs: TestControllerService, pToken: string, bookletDbId: number): Observable<boolean> {
      return bs.getUnitData(this.id)
        .pipe(
          switchMap(myData => {
            console.log(myData);
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

                  return tcs.loadItemplayerOk(pToken, bookletDbId, this.unitDefinitionType).pipe(
                    switchMap(ok => {
                      if (ok && definitionRef.length > 0) {
                        return bs.getUnitResourceTxt(pToken, bookletDbId, definitionRef).pipe(
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

// .....................................................................
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
// .....................................................................
export class SessionDataToSend {
    public readonly unitId: string;
    public response = '';
    public restorePoint$ = new BehaviorSubject<string>('');

    constructor (unitId: string) {
      this.unitId = unitId;
    }
}

// .....................................................................
// .....................................................................
export class BookletDef {
    id: string;
    label: string;
    units: UnitDef[];
    navibar: string;

    private addUnits(node: Element, startLockKey: string, startLockPrompt: string) {
      const childElements = node.children;
      if (childElements.length > 0) {
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
            if (restrictionElements[childIndex].nodeName === 'StartLock') {
              const restrictionParameter = restrictionElements[childIndex].getAttribute('parameter');
              if ((typeof restrictionParameter !== 'undefined') && (restrictionParameter !== null)) {
                startLockKey = restrictionParameter.toUpperCase();
                startLockPrompt = restrictionElements[childIndex].textContent;
                break;
              }
            }
          }
        }

        for (let childIndex = 0; childIndex < childElements.length; childIndex++) {
          if (childElements[childIndex].nodeName === 'Unit') {
            const newUnit = new UnitDef(childElements[childIndex].getAttribute('id'),
                  childElements[childIndex].getAttribute('label'));
            const shortLabel = childElements[childIndex].getAttribute('labelshort');
            if ((typeof shortLabel !== 'undefined') && (shortLabel !== null)) {
              newUnit.shortlabel = shortLabel;
            }
            if (startLockKey.length > 0) {
              newUnit.startLockKey = startLockKey;
              newUnit.startLockPrompt = startLockPrompt;
            }
            newUnit.sequenceId = this.units.length;
            this.units.push(newUnit);
          } else if (childElements[childIndex].nodeName === 'Testlet') {
            this.addUnits(childElements[childIndex], startLockKey, startLockPrompt);
          }
        }
      }
    }

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
          this.addUnits(unitsElements[0], '', '');
        }
      }
    }

    loadUnits(bs: BackendService, tcs: TestControllerService, pToken: string, bookletDbId: number): Observable<boolean[]> {
      const myUnitLoadings = [];
      for (let i = 0; i < this.units.length; i++) {
        myUnitLoadings.push(this.units[i].loadOk(bs, tcs, pToken, bookletDbId));
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

    forgetStartLock(key: string) {
      for (let i = 0; i < this.units.length; i++) {
        if (this.units[i].startLockKey === key) {
          this.units[i].startLockKey = '';
        }
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
