export interface StatusUpdate {

    personId: number;
    personLabel?: string;
    groupId?: number;
    groupLabel?: string;
    personStatus?: string;
    testId?: number;
    testLabel?: string;
    testState: {
        [testStateKey: string]: string
    };
    unitName?: string;
    unitLabel?: string;
    unitState: {
        [unitStateKey: string]: string
    };
    timestamp: number;
}
