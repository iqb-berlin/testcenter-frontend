// used everywhere
export interface TaggedString {
    tag: string;
    value: string;
}

export interface UnitResponseData {
    unitDbKey: string;
    response: string;
    responseType: string;
}

export interface UnitRestorePointData {
    unitDbKey: string;
    restorePoint: string;
}

// testcontroller restrictions +++++++++++++++++++++++++++++++++++
export interface StartLockData {
    title: string;
    prompt: string;
    codes: CodeInputData[];
}

export interface CodeInputData {
    testletId: string;
    prompt: string;
    code: string;
    value: string;
}

// for backend ++++++++++++++++++++++++++++++++++++++++++++++++++++++
export interface KeyValuePair {
    [K: string]: string;
}

export interface UnitData {
    xml: string;
    restorepoint: string;
    laststate: KeyValuePair[];
}

export interface TestData {
  xml: string;
  mode: string;
  laststate: KeyValuePair[];
}

export enum TestStatus {
  RUNNING = "RUNNING",
  WAITING_LOAD_COMPLETE = "WAITING_LOAD_COMPLETE",
  TERMINATED = "TERMINATED",
  PAUSED = "PAUSED",
  WAITING_LOAD_START = "WAITING_LOAD_START",
  ERROR = "ERROR"
}

export interface UnitMenuButtonData {
  sequenceId: number;
  label: string;
  isCurrent: boolean;
}

// for testcontroller service ++++++++++++++++++++++++++++++++++++++++
export interface BookletStateEntry {
    bookletDbId: number;
    timestamp: number;
    entryKey: string;
    entry: string;
}

export interface BookletLogData {
    bookletDbId: number;
    timestamp: number;
    entry: string;
}

export interface UnitLogData {
    bookletDbId: number;
    unitDbKey: string;
    timestamp: number;
    entry: string;
}

export enum LastStateKey {
    LASTUNIT = 'LASTUNIT',
    MAXTIMELEFT = 'MAXTIMELEFT',
    PRESENTATIONCOMPLETE = 'PRESENTATIONCOMPLETE'
}

export enum LogEntryKey {
    UNITENTER = 'UNITENTER',
    UNITTRYLEAVE = 'UNITTRYLEAVE',
    BOOKLETLOADSTART = 'BOOKLETLOADSTART',
    BOOKLETLOADCOMPLETE = 'BOOKLETLOADCOMPLETE',
    PAGENAVIGATIONSTART = 'PAGENAVIGATIONSTART',
    PAGENAVIGATIONCOMPLETE = 'PAGENAVIGATIONCOMPLETE',
    PRESENTATIONCOMPLETE = 'PRESENTATIONCOMPLETE',
    RESPONSESCOMPLETE = 'RESPONSESCOMPLETE'
}

export enum RunModeKey {
  HOT_RETURN = "run-hot-return",
  HOT_RESTART = "run-hot-restart",
  TRIAL = "run-trial",
  REVIEW = "run-review",
  DEMO = "demo"
}

export enum MaxTimerDataType {
    STARTED = 'STARTED',
    STEP = 'STEP',
    CANCELLED = 'CANCELLED',
    ENDED = 'ENDED'
}

export interface UnitNaviButtonData {
  sequenceId: number;
  disabled: boolean;
  shortLabel: string;
  longLabel: string;
  testletLabel: string;
  isCurrent: boolean;
}

// for unithost ++++++++++++++++++++++++++++++++++++++++++++++++++++++
export interface PageData {
    index: number;
    id: string;
    type: '#next' | '#previous' | '#goto';
    disabled: boolean;
}

export interface ReviewDialogData {
  loginname: string;
  bookletname: string;
  unitDbKey: string;
  unitTitle: string;
}

export enum NoUnitFlag {
  END = "end",
  ERROR = "error"
}

export interface KeyValuePairNumber {
  [K: string]: number;
}

export enum UnitNavigationTarget {
  NEXT = "#next",
  ERROR = "#error",
  PREVIOUS = "#previous",
  FIRST = "#first",
  LAST = "#last",
  END = "#end",
  MENU = "#menu",
  PAUSE = "#pause"
}
