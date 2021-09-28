// used everywhere
export interface TaggedString {
  tag: string;
  value: string;
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

export type UnitData = {
  data: string;
  state: KeyValuePair[];
  playerId: string;
} & (
  | { definitionRef: string; definition?: string; }
  | { definitionRef?: string; definition: string; }
);

export interface TestData {
  xml: string;
  mode: string;
  laststate: StateReportEntry[];
}

export enum TestStateKey {
  CURRENT_UNIT_ID = 'CURRENT_UNIT_ID',
  TESTLETS_TIMELEFT = 'TESTLETS_TIMELEFT',
  TESTLETS_CLEARED_CODE = 'TESTLETS_CLEARED_CODE',
  FOCUS = 'FOCUS',
  CONTROLLER = 'CONTROLLER',
  CONNECTION = 'CONNECTION'
}

/**
 * TestState.state
 * In what state is the whole controller?
 */
export enum TestControllerState {
  INIT = 'INIT',
  LOADING = 'LOADING',
  RUNNING = 'RUNNING',
  TERMINATED = 'TERMINATED',
  FINISHED = 'FINISHED',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR'
}

/**
 * TestState.FOCUS
 * Do the application-window has focus or not (because another window or tab has it)?
 */
export enum AppFocusState {
  HAS = 'HAS',
  HAS_NOT = 'HAS_NOT',
  DEAD = 'DEAD'
}

/**
 * TestState.CONNECTION
 * What kind of connection to the server do we have to receive possible commands from a group-monitor?
 * This can get a third special-value called LOST, which is set *by the backend* on connection loss.
 */
export enum TestStateConnectionValue {
  WEBSOCKET = 'WEBSOCKET',
  POLLING = 'POLLING'
}

export enum TestLogEntryKey {
  LOADCOMPLETE = 'LOADCOMPLETE'
}

export interface StateReportEntry {
  key: string; // TestStateKey | TestLogEntryKey | UnitStateKey | PlayerLogKey (unknown, up to the player)
  timeStamp: number;
  content: string;
}

export interface UnitStateData {
  unitDbKey: string;
  dataPartsAllString: string;
  unitStateDataType: string;
}

export enum UnitPlayerState {
  LOADING = 'LOADING',
  RUNNING = 'RUNNING',
  PAGE_NAVIGATING = 'PAGE_NAVIGATING'
}

export enum UnitStateKey {
  PRESENTATION_PROGRESS = 'PRESENTATION_PROGRESS',
  RESPONSE_PROGRESS = 'RESPONSE_PROGRESS',
  CURRENT_PAGE_ID = 'CURRENT_PAGE_ID',
  CURRENT_PAGE_NR = 'CURRENT_PAGE_NR',
  PAGE_COUNT = 'PAGE_COUNT',
  PLAYER = 'PLAYER'
}

export interface UnitLogData {
  bookletDbId: number;
  unitDbKey: string;
  timestamp: number;
  entry: string;
}

// for testcontroller service ++++++++++++++++++++++++++++++++++++++++

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
  unitDataParts: string;
  unitDefinition: string;
  currentPage: string;
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
export function isKnownCommand(keyword: string): keyword is CommandKeyword {
  return (commandKeywords as readonly string[]).includes(keyword);
}

export interface Command {
  keyword: CommandKeyword;
  id: number; // a unique id for each command, to make sure each one get only performed once (even in polling mode)
  arguments: string[];
  timestamp: number;
}

export type OnOff = 'ON' | 'OFF';
export function isOnOff(s: string): s is OnOff {
  return ['ON', 'OFF'].indexOf(s) > -1;
}

export interface LoadingProgress {
  progress: number | 'UNKNOWN' | 'PENDING';
}

// export type LoadingProgress = LoadingProgressSpecial | LoadingProgressRegular;

export interface LoadedFile {
  content: string;
}

export type LoadingFile = LoadingProgress | LoadedFile;

export function isLoadingFileLoaded(loadingFile: LoadingFile): loadingFile is LoadedFile {
  return 'content' in loadingFile;
}
