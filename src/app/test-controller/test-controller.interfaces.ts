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

export interface BookletData {
    xml: string;
    locked: boolean;
    laststate: KeyValuePair[];
}

export interface UnitData {
    xml: string;
    restorepoint: string;
    laststate: KeyValuePair[];
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
    UNITLEAVE = 'UNITLEAVE',
    BOOKLETLOADSTART = 'BOOKLETLOADSTART',
    BOOKLETLOADCOMPLETE = 'BOOKLETLOADCOMPLETE',
    PAGENAVIGATIONSTART = 'PAGENAVIGATIONSTART',
    PAGENAVIGATIONCOMPLETE = 'PAGENAVIGATIONCOMPLETE',
    PRESENTATIONCOMPLETE = 'PRESENTATIONCOMPLETE',
    RESPONSESCOMPLETE = 'RESPONSESCOMPLETE'
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
  label: string;
  isCurrent: boolean;
}

// for unithost ++++++++++++++++++++++++++++++++++++++++++++++++++++++
export interface PageData {
    index: number;
    id: string;
    type: '#next' | '#previous' | '#goto';
    disabled: boolean;
}
