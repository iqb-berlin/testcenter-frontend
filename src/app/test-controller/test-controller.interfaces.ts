export interface UnitLogData {
    unitName: string;
    logEntry: string;
}

export interface UnitResponseData {
    unitName: string;
    response: string;
    responseType: string;
}

export interface UnitRestorePointData {
    unitName: string;
    unitSequenceId: number;
    restorePoint: string;
}

export interface StartLockData {
    prompt: string;
    keyPreset: string;
}

export interface BookletData {
    xml: string;
    locked: boolean;
    state: BookletState;
}

export interface UnitData {
    xml: string;
    restorepoint: string;
    status: {};
}

export interface BookletState {
    u: number;
    responses: string;
    presented: string;
    status: string;
}

export interface CodeInputData {
    prompt: string;
    code: string;
    value: string;
}

export interface TaggedString {
    tag: string;
    value: string;
}

export interface PageData {
    index: number;
    id: string;
    type: 'next' | 'prev' | 'goto';
    disabled: boolean;
}
