// used everywhere
export interface TaggedString {
    tag: string;
    value: string;
}

export interface UnitStateData {
    unitDbKey: string;
    dataPartsAllString: string;
    unitStateDataType: string;
}
export interface KeyValuePairString {
  [K: string]: string;
}

export enum WindowFocusState {
  PLAYER = 'PLAYER',
  HOST = 'HOST',
  UNKNOWN = 'UNKNOWN'
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
  WAITING_LOAD_COMPLETE = 'WAITING_LOAD_COMPLETE',
  WAITING_LOAD_START = 'WAITING_LOAD_START',
  RUNNING = 'RUNNING',
  TERMINATED = 'TERMINATED',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR',
  TERMINATING = 'TERMINATING',
}

export interface UnitMenuButtonData {
  sequenceId: number;
  label: string;
  isCurrent: boolean;
  isDisabled: boolean;
  testletLabel: string;
  testletMarker: string;
}

// for testcontroller service ++++++++++++++++++++++++++++++++++++++++

export interface UnitLogData {
    bookletDbId: number;
    unitDbKey: string;
    timestamp: number;
    entry: string;
}

export enum LastStateKey {
    LASTUNIT = 'LASTUNIT',
    MAXTIMELEFT = 'MAXTIMELEFT',
    FOCUS = 'FOCUS',
    PAUSED = 'PAUSED'
}

export interface UnitStatus {
    PRESENTATIONCOMPLETE?: string;
    RESPONSESCOMPLETE?: string;
    PAGE_NR?: number;
    PAGE_NAME?: string;
    PAGES_COUNT?: number;
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

export enum MaxTimerDataType {
    STARTED = 'STARTED',
    STEP = 'STEP',
    CANCELLED = 'CANCELLED',
    INTERRUPTED = 'INTERRUPTED',
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
  END = 'end',
  ERROR = 'error'
}

export interface PendingUnitData {
  playerId: string;
  unitState: string;
  unitDefinition: string;
}

export interface KeyValuePairNumber {
  [K: string]: number;
}

export enum UnitNavigationTarget {
  NEXT = '#next',
  ERROR = '#error',
  PREVIOUS = '#previous',
  FIRST = '#first',
  LAST = '#last',
  END = '#end',
  MENU = '#menu',
  PAUSE = '#pause'
}


export const commandKeywords = [
    'pause',
    'goto',
    'terminate',
    'resume',
    'debug'
];
export type CommandKeyword = (typeof commandKeywords)[number];
export function isKnownCommand (keyword: string): keyword is CommandKeyword {
    return (commandKeywords as readonly string[]).includes(keyword);
}

export interface Command {
    keyword: CommandKeyword;
    id: number; // a unique id for each command, to make sure each one get only performed once (even in polling mode)
    arguments: string[];
    timestamp: number;
}
