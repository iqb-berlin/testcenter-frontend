import { Injectable } from '@angular/core';
import {
  Booklet,
  BookletError,
  isUnit,
  Testlet,
  TestSession,
  TestSessionData,
  TestSessionSuperState,
  UnitContext
} from './group-monitor.interfaces';
import { TestMode } from '../config/test-mode';

@Injectable()
export class TestSessionService {
  static isBooklet = (bookletOrError: Booklet|BookletError): bookletOrError is Booklet => !('error' in bookletOrError);

  static hasState(state: Record<string, unknown>, key: string, value = null): boolean {
    return ((typeof state[key] !== 'undefined') && ((value !== null) ? (state[key] === value) : true));
  }

  static analyzeTestSession(session: TestSessionData, booklet: Booklet | BookletError): TestSession {
    const currentUnitContext = TestSessionService.isBooklet(booklet) ?
      TestSessionService.getCurrent(booklet.units, session.unitName) : null;
    return {
      data: session,
      id: TestSessionService.getId(session),
      state: TestSessionService.getSuperState(session),
      current: currentUnitContext && currentUnitContext.unit ? currentUnitContext : null,
      booklet,
      timeLeft: TestSessionService.parseJsonState(session.testState, 'TESTLETS_TIMELEFT'),
      clearedCodes: TestSessionService.parseJsonState(session.testState, 'TESTLETS_CLEARED_CODE')
    };
  }

  static stateString(state: Record<string, string>, keys: string[], glue = ''): string {
    return keys
      .map((key: string) => (TestSessionService.hasState(state, key) ? state[key] : null))
      .filter((value: string) => value !== null)
      .join(glue);
  }

  private static getId(session: TestSessionData): number {
    return session.personId * 10000 + session.testId;
  }

  private static getMode = (modeString: string): { modeId: string, modeLabel: string } => {
    const testMode = new TestMode(modeString);
    return {
      modeId: testMode.modeId,
      modeLabel: testMode.modeLabel
    };
  };

  private static getSuperState(session: TestSessionData): TestSessionSuperState {
    if (session.mode === 'monitor-group') {
      return 'monitor_group';
    }
    if (TestSessionService.getMode(session.mode).modeId !== 'HOT') {
      return 'demo';
    }

    const state = session.testState;

    if (this.hasState(state, 'status', 'pending')) {
      return 'pending';
    }
    if (this.hasState(state, 'status', 'locked')) {
      return 'locked';
    }
    if (this.hasState(state, 'CONTROLLER', 'ERROR')) {
      return 'error';
    }
    if (this.hasState(state, 'CONTROLLER', 'TERMINATED')) {
      return 'controller_terminated';
    }
    if (this.hasState(state, 'CONNECTION', 'LOST')) {
      return 'connection_lost';
    }
    if (this.hasState(state, 'CONTROLLER', 'PAUSED')) {
      return 'paused';
    }
    if (this.hasState(state, 'FOCUS', 'HAS_NOT')) {
      return 'focus_lost';
    }
    if (TestSessionService.idleSinceMinutes(session) > 5) {
      return 'idle';
    }
    if (this.hasState(state, 'CONNECTION', 'WEBSOCKET')) {
      return 'connection_websocket';
    }
    if (this.hasState(state, 'CONNECTION', 'POLLING')) {
      return 'connection_polling';
    }
    return 'ok';
  }

  private static idleSinceMinutes(testSession: TestSessionData): number {
    return (Date.now() - testSession.timestamp * 1000) / (1000 * 60);
  }

  private static parseJsonState(testStateObject: Record<string, string>, key: string): Record<string, string>|null {
    if (typeof testStateObject[key] === 'undefined') {
      return null;
    }

    const stateValueString = testStateObject[key];

    try {
      return JSON.parse(stateValueString);
    } catch (error) {
      // console.warn(`state ${key} is no valid JSON`, stateValueString, error);
      return null;
    }
  }

  private static getCurrent(testlet: Testlet, unitName: string, level = 0, countGlobal = 0,
                            countAncestor = 0, ancestor: Testlet = null, testletCount = 0): UnitContext {
    let result: UnitContext = {
      unit: null,
      parent: null,
      ancestor: (level <= 1) ? testlet : ancestor,
      unitCount: 0,
      unitCountGlobal: countGlobal,
      unitCountAncestor: countAncestor,
      indexGlobal: -1,
      indexLocal: -1,
      indexAncestor: -1,
      testletCountGlobal: testletCount,
      parentIndexGlobal: -1
    };

    let i = -1;
    // eslint-disable-next-line no-plusplus
    while (i++ < testlet.children.length - 1) {
      const testletOrUnit = testlet.children[i];

      if (isUnit(testletOrUnit)) {
        if (testletOrUnit.id === unitName) {
          result.indexGlobal = result.unitCountGlobal;
          result.indexLocal = result.unitCount;
          result.indexAncestor = result.unitCountAncestor;
          result.unit = testletOrUnit;
          result.parent = testlet;
          result.parentIndexGlobal = result.testletCountGlobal;
        }

        result.unitCount += 1;
        result.unitCountGlobal += 1;
        result.unitCountAncestor += 1;
      } else {
        const subResult = TestSessionService.getCurrent(
          testletOrUnit,
          unitName,
          level + 1,
          result.unitCountGlobal,
          (level < 1) ? 0 : result.unitCountAncestor,
          result.ancestor,
          result.testletCountGlobal + 1
        );
        result.unitCountGlobal = subResult.unitCountGlobal;
        result.unitCountAncestor = (level < 1) ? result.unitCountAncestor : subResult.unitCountAncestor;
        result.testletCountGlobal = subResult.testletCountGlobal;

        if (subResult.indexLocal >= 0) {
          result = subResult;
        }
      }
    }
    return result;
  }
}
