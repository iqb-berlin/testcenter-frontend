import { TestSession, TestSessionData, TestSessionSetStats } from './group-monitor.interfaces';
import { TestSessionService } from './test-session.service';
import { exampleBooklet } from './booklet.service.spec';

export const unitTestExampleSessions: TestSession[] = [
  <TestSessionData>{
    personId: 1,
    personLabel: 'Person 1',
    groupName: 'group-1',
    groupLabel: 'Group 1',
    mode: 'run-hot-return',
    testId: 1,
    bookletName: 'example-booklet',
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
    bookletName: 'example-booklet-2',
    testState: {
      CONTROLLER: 'PAUSED',
      status: 'running'
    },
    unitName: 'unit-7',
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
    bookletName: 'example-booklet-3',
    testState: {
      status: 'pending'
    },
    unitName: null,
    unitState: {},
    timestamp: 10000000
  }
].map(session => TestSessionService.analyzeTestSession(session, exampleBooklet));

export const unitTestAllSessionsInfo: TestSessionSetStats = {
  all: false,
  number: 0,
  numberOfDifferentBookletSpecies: 0,
  numberOfDifferentBooklets: 0
};

export const unitTestCheckedSessionsInfo: TestSessionSetStats = {
  all: false,
  number: 0,
  numberOfDifferentBookletSpecies: 0,
  numberOfDifferentBooklets: 0
};
