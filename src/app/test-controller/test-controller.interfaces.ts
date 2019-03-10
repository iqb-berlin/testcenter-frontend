// used everywhere
export interface TaggedString {
    tag: string;
    value: string;
}

export interface UnitResponseData {
    bookletDbId: number;
    unitDbKey: string;
    timestamp: number;
    response: string;
    responseType: string;
}

export interface UnitRestorePointData {
    bookletDbId: number;
    unitDbKey: string;
    unitSequenceId: number;
    timestamp: number;
    restorePoint: string;
}

// testcontroller restrictions +++++++++++++++++++++++++++++++++++
export interface StartLockData {
    prompt: string;
    keyPreset: string;
}

export interface CodeInputData {
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
    LASTUNIT = 'LASTUNIT'
}

export enum LogEntryKey {
    UNITSTART = 'UNITSTART',
    UNITLEAVE = 'UNITLEAVE',
    BOOKLETLOADSTART = 'BOOKLETLOADSTART',
    BOOKLETLOADCOMPLETE = 'BOOKLETLOADCOMPLETE',
    PAGENAVIGATIONSTART = 'PAGENAVIGATIONSTART',
    PAGENAVIGATIONCOMPLETE = 'PAGENAVIGATIONCOMPLETE',
    PRESENTATIONCOMPLETE = 'PRESENTATIONCOMPLETE',
    RESPONSESCOMPLETE = 'RESPONSESCOMPLETE'
}

// for unithost ++++++++++++++++++++++++++++++++++++++++++++++++++++++
export interface PageData {
    index: number;
    id: string;
    type: '#next' | '#previous' | '#goto';
    disabled: boolean;
}
