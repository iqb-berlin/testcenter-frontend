import { Injectable } from '@angular/core';
import { TestSession, TestSessionSuperState } from './group-monitor.interfaces';
import { TestMode } from '../config/test-mode';

@Injectable()
export class TestSessionService {
  static hasState(state: Record<string, unknown>, key: string, value = null): boolean {
    return ((typeof state[key] !== 'undefined') && ((value !== null) ? (state[key] === value) : true));
  }

  static getPersonXTestId(session: TestSession): number {
    return session.personId * 10000 + session.testId;
  }

  static getMode = (modeString: string): { modeId: string, modeLabel: string } => {
    const testMode = new TestMode(modeString);
    return {
      modeId: testMode.modeId,
      modeLabel: testMode.modeLabel
    };
  };

  static getSuperState(session: TestSession): TestSessionSuperState {
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
    if (this.hasState(state, 'CONNECTION', 'WEBSOCKET')) {
      return 'connection_websocket';
    }
    if (this.hasState(state, 'CONNECTION', 'POLLING')) {
      return 'connection_polling';
    }
    return 'ok';
  }

  static parseJsonState(testStateObject: Record<string, string>, key: string): Record<string, string>|null {
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

  static stateString(state: Record<string, string>, keys: string[], glue = ''): string {
    return keys
      .map((key: string) => (TestSessionService.hasState(state, key) ? state[key] : null))
      .filter((value: string) => value !== null)
      .join(glue);
  }
}
