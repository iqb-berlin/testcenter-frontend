import { MaxTimerDataType } from './test-controller.interfaces';

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

  getMaxSequenceId(tmpId = 0): number {
    if (this.sequenceId >= tmpId) {
      tmpId = this.sequenceId + 1;
    }
    this.children.forEach(tce => {
      tmpId = tce.getMaxSequenceId(tmpId);
    });
    return tmpId;
  }
}

export class UnitDef extends TestletContentElement {
  readonly alias: string;
  readonly naviButtonLabel: string;
  playerId: string;
  statusResponses: 'no' | 'some' | 'all';
  statusPresentation: 'no' | 'partly' | 'full';
  locked = false;
  ignoreCompleted = false;

  constructor(
    sequenceId: number,
    id: string,
    title: string,
    alias: string,
    naviButtonLabel: string
    ) {
      super(sequenceId, id, title);
      this.alias = alias;
      this.naviButtonLabel = naviButtonLabel;
      this.statusResponses = 'no';
      this.statusPresentation = 'no';
  }


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

export class UnitControllerData {
  unitDef: UnitDef = null;
  codeRequiringTestlets: Testlet[] = [];
  maxTimerRequiringTestlet: Testlet = null;
  testletLabel = '';
  constructor(unitDef: UnitDef) {
    this.unitDef = unitDef;
  }
}

export class Testlet extends TestletContentElement {
  codeToEnter = '';
  codePrompt = '';
  maxTimeLeft = -1;


  addTestlet(id: string, title: string): Testlet {
    const newChild = new Testlet(0, id, title);
    this.children.push(newChild);
    return newChild;
  }


  addUnit(
    sequenceId: number,
    id: string,
    title: string,
    alias: string,
    naviButtonLabel: string): UnitDef {
    const newChild = new UnitDef(sequenceId, id, title, alias, naviButtonLabel);
    this.children.push(newChild);
    return newChild;
  }

  // first looking for the unit, then on the way back adding restrictions
  getUnitAt(sequenceId: number, isEntryPoint = true): UnitControllerData {
    let myreturn: UnitControllerData = null;
    for (const tce of this.children) {
      if (tce instanceof Testlet) {
        const localTestlet = tce as Testlet;
        myreturn = localTestlet.getUnitAt(sequenceId, false);
        if (myreturn !== null) {
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
      if (this.maxTimeLeft > 0) {
        myreturn.maxTimerRequiringTestlet = this;
      }
      if (!isEntryPoint) {
        const label = this.title.trim();
        if (label) {
          myreturn.testletLabel = label;
        }

      }
    }
    return myreturn;
  }

  getSequenceIdByUnitAlias(alias: string): number {
    let myReturn = -1;
    for (const tce of this.children) {
      if (tce instanceof Testlet) {
        const localTestlet = tce as Testlet;
        myReturn = localTestlet.getSequenceIdByUnitAlias(alias);
        if (myReturn >= 0) {
          break;
        }
      } else if (tce instanceof UnitDef) {
        if (tce.alias === alias) {
          myReturn = (tce as UnitDef).sequenceId;
          break;
        }
      }
    }
    return myReturn;
  }

  getTestlet(testletId: string): Testlet {
    let myreturn = null;
    if (this.id === testletId) {
      myreturn = this;
    } else {
      for (const tce of this.children) {
        if (tce instanceof Testlet) {
          const localTestlet = tce as Testlet;
          myreturn = localTestlet.getTestlet(testletId);
          if (myreturn !== null) {
            break;
          }
        }
      }
    }
    return myreturn;
  }

  getAllUnitSequenceIds(testletId = ''): number[] {
    let myreturn = [];

    if (testletId) {
      // find testlet
      const myTestlet = this.getTestlet(testletId);
      if (myTestlet) {
        myreturn = myTestlet.getAllUnitSequenceIds();
      }
    } else {
      for (const tce of this.children) {
        if (tce instanceof Testlet) {
          const localTestlet = tce as Testlet;
          localTestlet.getAllUnitSequenceIds().forEach(u => myreturn.push(u));
        } else {
          const localUnit = tce as UnitDef;
          myreturn.push(localUnit.sequenceId);
        }
      }
    }
    return myreturn;
  }

  setTimeLeft(testletId: string , maxTimeLeft: number ) {
    if (testletId) {
      // find testlet
      const myTestlet = this.getTestlet(testletId);
      if (myTestlet) {
        myTestlet.setTimeLeft('', maxTimeLeft);
        if (maxTimeLeft === 0) {
          myTestlet.lockUnits_allChildren();
        }
      }
    } else {
      this.maxTimeLeft = maxTimeLeft;
      for (const tce of this.children) {
        if (tce instanceof Testlet) {
          const localTestlet = tce as Testlet;
          localTestlet.setTimeLeft('', maxTimeLeft);
        }
      }
    }
  }

  lockUnits_allChildren(testletId = '') {
    if (testletId) {
      // find testlet
      const myTestlet = this.getTestlet(testletId);
      if (myTestlet) {
        myTestlet.lockUnits_allChildren();
      }
    } else {
      for (const tce of this.children) {
        if (tce instanceof Testlet) {
          const localTestlet = tce as Testlet;
          localTestlet.lockUnits_allChildren();
        } else {
          const localUnit = tce as UnitDef;
          localUnit.locked = true;
        }
      }
    }
  }

  private minTestletUnitSequenceId(id = -1): number {
    let myreturn = id;
    for (const tce of this.children) {
      if (tce instanceof Testlet) {
        const localTestlet = tce as Testlet;
        myreturn = localTestlet.minTestletUnitSequenceId(myreturn);
      } else {
        const localUnit = tce as UnitDef;
        if ((myreturn === -1) || (localUnit.sequenceId < myreturn)) {
          myreturn = localUnit.sequenceId;
        }
      }
    }
    return myreturn;
  }

  lockUnits_before(testletId = '') {
    let myTestlet: Testlet = this;
    if (testletId) {
      myTestlet = this.getTestlet(testletId);
    }
    const minSeq = myTestlet.minTestletUnitSequenceId();
    for (let i = minSeq - 1; i > 0; i--)  {
      const u = this.getUnitAt(i);
      u.unitDef.locked = true;
    }
  }

  getNextUnlockedUnitSequenceId(currentUnitSequenceId: number): number {
    currentUnitSequenceId += 1;
    let myUnit: UnitControllerData = this.getUnitAt(currentUnitSequenceId);
    while (myUnit !== null && myUnit.unitDef.locked) {
      currentUnitSequenceId += 1;
      myUnit = this.getUnitAt(currentUnitSequenceId);
    }
    if (myUnit) {
      myUnit.unitDef.ignoreCompleted = true;
    }
    return myUnit ? currentUnitSequenceId : 0;
  }

  getFirstUnlockedUnitSequenceId(startWith: number): number {
    let myreturn = startWith;
    const myUnit: UnitControllerData = this.getUnitAt(myreturn);
    if (myUnit) {
      if (myUnit.unitDef.locked) {
        myreturn = this.getNextUnlockedUnitSequenceId(myreturn);
      } else if (myreturn > 1) {
        let myPrevUnit: UnitControllerData = this.getUnitAt(myreturn - 1);
        while (myPrevUnit !== null && myreturn > 1 && !myPrevUnit.unitDef.locked) {
          myreturn -= 1;
          myPrevUnit = this.getUnitAt(myreturn - 1);
        }
      }
    }
    return myUnit ? myreturn : 0;
  }


  getLastUnlockedUnitSequenceId(startWith: number): number {
    const maxSequenceId = this.getMaxSequenceId();
    let myreturn = startWith;
    const myUnit: UnitControllerData = this.getUnitAt(myreturn);
    if (myUnit) {
      if (myUnit.unitDef.locked) {
        myreturn = this.getNextUnlockedUnitSequenceId(myreturn);
      }
      if (myreturn > 0 && myreturn < maxSequenceId) {
        let myNextUnit: UnitControllerData = this.getUnitAt(myreturn + 1);
        while (myNextUnit !== null && myreturn < maxSequenceId && !myNextUnit.unitDef.locked) {
          myreturn += 1;
          myNextUnit = this.getUnitAt(myreturn + 1);
        }
      }
    }

    return myUnit ? myreturn : 0;
  }

  lockUnitsIfTimeLeftNull(lock = false) {
    lock = lock || this.maxTimeLeft === 0;
    for (const tce of this.children) {
      if (tce instanceof Testlet) {
        const localTestlet = tce as Testlet;
        localTestlet.lockUnitsIfTimeLeftNull(lock);
      } else if (lock) {
        const localUnit = tce as UnitDef;
        localUnit.locked = true;
      }
    }
  }
}

export class EnvironmentData {
  public appVersion: string;
  public browserVersion = '';
  public browserName = '';
  public get browserTxt(): string {
    return `${this.browserName} Version ${this.browserVersion}`;
  }
  public osName = '';
  public screenSizeWidth = 0;
  public screenSizeHeight = 0;
  public loadTime: number = 0;
  public get screenSizeTxt(): string {
    return `Bildschirmgröße ist ${this.screenSizeWidth} x ${this.screenSizeWidth}`;
  }

  constructor (appVersion: string) {
    this.appVersion = appVersion;
    const deviceInfo = window.navigator.userAgent;

    // browser
    // @ts-ignore
    const regex = /(MSIE|Trident|(?!Gecko.+)Firefox|(?!AppleWebKit.+Chrome.+)Safari(?!.+Edge)|(?!AppleWebKit.+)Chrome(?!.+Edge)|(?!AppleWebKit.+Chrome.+Safari.+)Edge|AppleWebKit(?!.+Chrome|.+Safari)|Gecko(?!.+Firefox))(?: |\/)([\d\.apre]+)/;
    // credit due to: https://gist.github.com/ticky/3909462#gistcomment-2245669
    const deviceInfoSplits = regex.exec(deviceInfo);
    const helperRegex = /[^.]*/;
    const browserInfo = helperRegex.exec(deviceInfoSplits[0]);
    const browserInfoSplits = browserInfo[0].split('/');
    this.browserVersion = browserInfoSplits[1];
    this.browserName = browserInfoSplits[0];

    // os
    if (deviceInfo.indexOf('Windows') !== -1) {
      if (deviceInfo.indexOf('Windows NT 10.0') !== -1) {
        this.osName = 'Windows 10';
      } else if (deviceInfo.indexOf('Windows NT 6.2') !== -1) {
        this.osName = 'Windows 8';
      } else if (deviceInfo.indexOf('Windows NT 6.1') !== -1) {
        this.osName = 'Windows 7';
      } else if (deviceInfo.indexOf('Windows NT 6.0') !== -1) {
        this.osName = 'Windows Vista';
      } else if (deviceInfo.indexOf('Windows NT 5.1') !== -1) {
        this.osName = 'Windows XP';
      } else if (deviceInfo.indexOf('Windows NT 5.0') !== -1) {
        this.osName = 'Windows 2000';
      } else {
        this.osName = 'Windows, unbekannte Version';
      }
    } else if (deviceInfo.indexOf('Mac') !== -1) {
      this.osName = 'Mac/iOS';
    } else if (deviceInfo.indexOf('X11') !== -1) {
      this.osName = 'UNIX';
    } else if (deviceInfo.indexOf('Linux') !== -1) {
      this.osName = 'Linux';
    } else {
      this.osName = window.navigator.platform;
    }

    this.screenSizeHeight = window.screen.height;
    this.screenSizeWidth = window.screen.width;
  }
}

export class MaxTimerData {
  timeLeftSeconds: number; // seconds
  testletId: string;
  type: MaxTimerDataType;

  get timeLeftString() {
    const afterDecimal = Math.round(this.timeLeftSeconds % 60);
    return (Math.round(this.timeLeftSeconds - afterDecimal) / 60).toString()
              + ':' + (afterDecimal < 10 ? '0' : '') + afterDecimal.toString();
  }
  get timeLeftMinString() {
    return Math.round(this.timeLeftSeconds / 60).toString() + ' min';
  }

  constructor (timeMinutes: number, tId: string, type: MaxTimerDataType) {
    this.timeLeftSeconds = timeMinutes * 60;
    this.testletId = tId;
    this.type = type;
  }
}
