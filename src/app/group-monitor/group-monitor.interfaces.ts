import {BookletConfig} from '../config/booklet-config';

export interface StatusUpdate {

    personId: number;
    personLabel?: string;
    groupId?: number;
    groupLabel?: string;
    personStatus?: string;
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
}
