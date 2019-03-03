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
    constructor(code: number, labelNice: string, labelSystem = '') {
      this.code = code;
      this.labelNice = labelNice;
      this.labelSystem = labelSystem;
    }
}

// .....................................................................
// .....................................................................
export class TestletContentElement {
  readonly sequenceId: number;
  readonly id: string;
  readonly title: string;
  canEnter: 'y' | 'n' | 'w';
  canLeave: 'y' | 'n' | 'w';
  tryEnterMessage: string;
  tryLeaveMessage: string;
  children: TestletContentElement[];

  constructor(sequenceId: number, id: string, title: string) {
    this.sequenceId = sequenceId;
    this.id = id;
    this.title = title;
    this.canEnter = 'y';
    this.canLeave = 'y';
    this.tryEnterMessage = '';
    this.tryLeaveMessage = '';
    this.children = [];
  }

  // """"""""""""""""""""""""""""""""""""""""""""""""""""""""
  setCanEnter (can: string, message: string, allChildren = false) {
    let newCan: 'y' | 'n' | 'w' = 'y';
    if (can.length > 0) {
      const checkChar = can.substr(0, 1).toLowerCase();
      if (checkChar === 'n') {
        newCan = 'n';
      } else if (checkChar === 'w') {
        newCan = 'w';
      }
    }
    this.canEnter = newCan;
    this.tryEnterMessage = message;
    if (allChildren) {
      this.children.forEach(tce => {
        tce.setCanEnter(can, message, allChildren);
      });
    }
  }

  // """"""""""""""""""""""""""""""""""""""""""""""""""""""""
  setCanLeave (can: string, message: string, allChildren = false) {
    let newCan: 'y' | 'n' | 'w' = 'y';
    if (can.length > 0) {
      const checkChar = can.substr(0, 1).toLowerCase();
      if (checkChar === 'n') {
        newCan = 'n';
      } else if (checkChar === 'w') {
        newCan = 'w';
      }
    }
    this.canLeave = newCan;
    this.tryLeaveMessage = message;
    if (allChildren) {
      this.children.forEach(tce => {
        tce.setCanLeave(can, message, allChildren);
      });
    }
  }

  // """"""""""""""""""""""""""""""""""""""""""""""""""""""""
  getNextSequenceId(tmpId = 0): number {
    if (this.sequenceId >= tmpId) {
      tmpId = this.sequenceId + 1;
    }
    this.children.forEach(tce => {
      tmpId = tce.getNextSequenceId(tmpId);
    });
    return tmpId;
  }
}

// .....................................................................
// .....................................................................
export class UnitDef extends TestletContentElement {
  readonly alias: string;
  readonly naviButtonLabel: string;
  readonly playerId: string;
  readonly reportStatus: boolean;
  statusResponses: 'no' | 'some' | 'all';
  statusPresentation: 'no' | 'partly' | 'full';

  constructor(
    sequenceId: number,
    id: string,
    title: string,
    alias: string,
    naviButtonLabel: string,
    reportStatus: boolean,
    ) {
      super(sequenceId, id, title);
      this.alias = alias;
      this.naviButtonLabel = naviButtonLabel;
      this.reportStatus = reportStatus;
      this.statusResponses = 'no';
      this.statusPresentation = 'no';
  }

  // """"""""""""""""""""""""""""""""""""""""""""""""""""""""
  setStatusResponses (status: string) {
    let newStatus: 'no' | 'some' | 'all' = 'no';
    if (status.length > 0) {
      const checkChar = status.substr(0, 1).toLowerCase();
      if (checkChar === 's') {
        newStatus = 'some';
      } else if (checkChar === 'a') {
        newStatus = 'all';
      }
    }
    this.statusResponses = newStatus;
  }

  // """"""""""""""""""""""""""""""""""""""""""""""""""""""""
  setStatusPresentation (status: string) {
    let newStatus: 'no' | 'partly' | 'full' = 'no';
    if (status.length > 0) {
      const checkChar = status.substr(0, 1).toLowerCase();
      if (checkChar === 'p') {
        newStatus = 'partly';
      } else if (checkChar === 'f') {
        newStatus = 'full';
      }
    }
    this.statusPresentation = newStatus;
  }
}

// .....................................................................
// .....................................................................
export class UnitControllerData {
  unitDef: UnitDef = null;
  codeRequiringTestlets: Testlet[] = [];
  constructor(unitDef: UnitDef) {
    this.unitDef = unitDef;
  }
}

// .....................................................................
// .....................................................................
export class Testlet extends TestletContentElement {
  codeToEnter = '';
  codePrompt = '';

  // """"""""""""""""""""""""""""""""""""""""""""""""""""""""
  addTestlet(id: string, title: string): Testlet {
    const newChild = new Testlet(0, id, title);
    this.children.push(newChild);
    return newChild;
  }

  // """"""""""""""""""""""""""""""""""""""""""""""""""""""""
  addUnit(
    sequenceId: number,
    id: string,
    title: string,
    alias: string,
    naviButtonLabel: string,
    reportStatus: boolean): UnitDef {
    const newChild = new UnitDef(sequenceId, id, title, alias, naviButtonLabel, reportStatus);
    this.children.push(newChild);
    return newChild;
  }

  // first looking for the unit, then on the way back adding restrictions
  getUnitAt(sequenceId: number): UnitControllerData {
    let myreturn: UnitControllerData = null;
    for (const tce of this.children) {
      if (tce instanceof Testlet) {
        const localTestlet = tce as Testlet;
        myreturn = localTestlet.getUnitAt(sequenceId);
        if (myreturn !== null) {
          if (localTestlet.codeToEnter.length > 0) {
            myreturn.codeRequiringTestlets.push(localTestlet);
          }
          break;
        }
      } else if (tce instanceof UnitDef) {
        if (tce.sequenceId === sequenceId) {
          myreturn = new UnitControllerData(tce);
          break;
        }
      }
    }
    if (myreturn !== null) {
      if (this.codeToEnter.length > 0) {
        myreturn.codeRequiringTestlets.push(this);
      }
    }
    return myreturn;
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

  // forgetStartLock(key: string) {
  //   for (let i = 0; i < this.units.length; i++) {
  //     if (this.units[i].startLockKey === key) {
  //       this.units[i].startLockKey = '';
  //     }
  //   }
  // }

  // unlockedUnitCount(): number {
  //   let myCount = 0;
  //   for (let i = 0; i < this.units.length; i++) {
  //     if (!this.units[i].locked) {
  //       myCount += 1;
  //     }
  //   }
  //   return myCount;
  // }

// 7777777777777777777777777777777777777777777777777777777777777
export class BookletConfig {
  showMainNaviButtons: boolean;
}
