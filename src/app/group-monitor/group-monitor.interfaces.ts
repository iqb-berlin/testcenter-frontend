import {BookletConfig} from '../config/booklet-config';

export interface TestSession {

    personId: number;
    personLabel?: string;
    groupName?: string;
    groupLabel?: string;
    mode?: string;
    testId?: number;
    bookletName?: string;
    testState: {
        [testStateKey: string]: string
    };
    unitName?: string;
    unitState: {
        [unitStateKey: string]: string
    };
    timestamp: number;
}

export interface Booklet {
    metadata: BookletMetadata;
    config: BookletConfig;
    restrictions?: Restrictions;
    units: Testlet;
}

export interface BookletError {
    error: 'xml' | 'missing-id' | 'missing-file' | 'general',
}

export interface BookletMetadata {
    id: string;
    label: string;
    description: string;
    owner?: string;
    lastchange?: string;
    status?: string;
    project?: string;
}

export interface Testlet {
    id: string;
    label: string;
    restrictions?: Restrictions;
    children: (Unit|Testlet)[];
    descendantCount: number
}

export interface Unit {
    id: string;
    label: string;
    labelShort: string;
}

export interface Restrictions {
    codeToEnter?: {
        code: string;
        message: string;
    }
    timeMax?: number;
    lock?: {
        message: string;
    }
}

export interface GroupData {
    name: string;
    label: string;
}

export type TestViewDisplayOptionKey = 'view' | 'groupColumn';

export interface TestViewDisplayOptions {
    view: 'full' | 'medium' | 'small';
    groupColumn: 'show' | 'hide';
}
