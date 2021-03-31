import {
  Booklet, CommandResponse, TestSession, TestSessionData, TestSessionSetStats
} from './group-monitor.interfaces';
import { TestSessionService } from './test-session.service';

// labels are: {global index}-{ancestor index}-{local index}
export const unitTestExampleBooklets: { [name: string]: Booklet } = {
  example_booklet_1: {
    species: 'example-species-1',
    config: undefined,
    metadata: {
      id: '1',
      label: 'Label 1',
      description: 'Description 1'
    },
    units: {
      id: 'root',
      label: 'Root',
      descendantCount: 10,
      children: [
        { id: 'unit-1', label: '0-0-0', labelShort: 'unit' },
        {
          id: 'zara',
          label: 'Testlet-0',
          children: [],
          descendantCount: 6
        },
        { id: 'unit-2', label: '1-1-1', labelShort: 'unit' },
        {
          id: 'alf',
          label: 'Testlet-1',
          descendantCount: 4,
          children: [
            { id: 'unit-3', label: '2-0-0', labelShort: 'unit' },
            {
              id: 'ben',
              label: 'Testlet-2',
              descendantCount: 3,
              children: [
                { id: 'unit-4', label: '3-1-0', labelShort: 'unit' },
                {
                  id: 'cara',
                  label: 'Testlet-3',
                  descendantCount: 2,
                  children: []
                },
                { id: 'unit-5', label: '4-2-1', labelShort: 'unit' },
                {
                  id: 'dolf',
                  label: 'Testlet-4',
                  descendantCount: 1,
                  children: [
                    { id: 'unit-6', label: '5-3-0', labelShort: 'unit' }
                  ]
                }
              ]
            },
            { id: 'unit-7', label: '6-4-1', labelShort: 'unit' }
          ]
        },
        { id: 'unit-8', label: '7-2-2', labelShort: 'unit' },
        {
          id: 'ellie',
          label: 'Testlet-5',
          descendantCount: 2,
          children: [
            { id: 'unit-9', label: '8-0-0', labelShort: 'unit' },
            {
              id: 'fred',
              label: 'Testlet-6',
              descendantCount: 1,
              children: [
                { id: 'unit-10', label: '9-1-0', labelShort: 'unit' }
              ]
            }
          ]
        }
      ]
    }
  },
  example_booklet_2: {
    species: 'example-species-2',
    config: undefined,
    metadata: {
      id: 'Booklet-2',
      label: 'Label 2',
      description: 'Description 2'
    },
    units: {
      id: 'root',
      label: 'Root',
      descendantCount: 4,
      children: [
        {
          id: 'zara',
          label: 'Testlet-0',
          descendantCount: 3,
          children: [
            {
              id: 'alf',
              label: 'Testlet-1',
              descendantCount: 2,
              children: [
                {
                  id: 'alf',
                  label: 'Testlet-1',
                  descendantCount: 1,
                  children: [
                    { id: 'unit-1', label: '0-0-0', labelShort: 'unit' }
                  ]
                }
              ]
            }
          ]
        },
        { id: 'unit-2', label: '1-1-1', labelShort: 'unit' },
        {
          id: 'ben',
          label: 'Testlet-2',
          descendantCount: 0,
          children: []
        }
      ]
    }
  }
};

export const unitTestExampleSessions: TestSession[] = [
  <TestSessionData>{
    personId: 1,
    personLabel: 'Person 1',
    groupName: 'group-1',
    groupLabel: 'Group 1',
    mode: 'run-hot-return',
    testId: 1,
    bookletName: 'example_booklet_1',
    testState: {
      CONTROLLER: 'RUNNING',
      status: 'running'
    },
    unitName: 'unit-5',
    unitState: {},
    timestamp: 10000500
  },
  <TestSessionData>{
    personId: 1,
    personLabel: 'Person 1',
    groupName: 'group-1',
    groupLabel: 'Group 1',
    mode: 'run-hot-return',
    testId: 2,
    bookletName: 'example_booklet_2',
    testState: {
      CONTROLLER: 'PAUSED',
      status: 'running'
    },
    unitName: 'unit-1',
    unitState: {},
    timestamp: 10000300
  },
  <TestSessionData>{
    personId: 2,
    personLabel: 'Person 2',
    groupName: 'group-1',
    groupLabel: 'Group 1',
    mode: 'run-hot-return',
    testId: 3,
    bookletName: 'this_does_not_exist',
    testState: {
      status: 'pending'
    },
    unitName: null,
    unitState: {},
    timestamp: 10000000
  }
]
  .map(session => TestSessionService.analyzeTestSession(
    session, unitTestExampleBooklets[session.bookletName] || { error: 'missing-file', species: null }
  ));

export const unitTestSessionsStats: TestSessionSetStats = {
  all: false,
  number: 0,
  differentBookletSpecies: 0,
  differentBooklets: 0,
  paused: 0,
  locked: 0
};

export const unitTestCheckedStats: TestSessionSetStats = {
  all: false,
  number: 0,
  differentBookletSpecies: 0,
  differentBooklets: 0,
  paused: 0,
  locked: 0
};

export const unitTestCommandResponse: CommandResponse = {
  commandType: 'any',
  testIds: [0]
};
