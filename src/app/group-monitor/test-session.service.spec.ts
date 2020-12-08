/* eslint-disable object-curly-newline */
import { TestBed } from '@angular/core/testing';
import { TestSessionService } from './test-session.service';
import { exampleBooklet } from './booklet.service.spec';
import { TestSession } from './group-monitor.interfaces';

export const exampleSession: TestSession = {
  booklet: exampleBooklet,
  clearedCodes: undefined,
  current: undefined,
  data: {
    personId: 1,
    personLabel: 'Sample Person',
    groupName: 'sample_group',
    groupLabel: 'a sample group',
    mode: 'run-hot-return',
    testId: 1,
    bookletName: 'sample_booklet',
    testState: {
      CONTROLLER: 'PAUSED'
    },
    unitName: 'unit-4',
    unitState: {},
    timestamp: 1234567980
  },
  id: 0,
  state: undefined,
  timeLeft: undefined
};

describe('TestSessionService', () => {
  let service: TestSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestSessionService
      ]
    });
    service = TestBed.inject(TestSessionService);
  });

  it('should be created', () => {
    expect(service)
      .toBeTruthy();
  });

  describe('getUnitContext()', () => {
    it('should find correct indices, unit and parent', () => {
      const expectations = {
        'unit-0': { global: -1, ancestor: -1, local: -1 },
        'unit-1': { global: 0, ancestor: 0, local: 0, parentName: 'root', ancestorName: 'root' },
        'unit-2': { global: 1, ancestor: 1, local: 1, parentName: 'root', ancestorName: 'root' },
        'unit-3': { global: 2, ancestor: 0, local: 0, parentName: 'alf', ancestorName: 'alf' },
        'unit-4': { global: 3, ancestor: 1, local: 0, parentName: 'ben', ancestorName: 'alf' },
        'unit-5': { global: 4, ancestor: 2, local: 1, parentName: 'ben', ancestorName: 'alf' },
        'unit-6': { global: 5, ancestor: 3, local: 0, parentName: 'dolf', ancestorName: 'alf' },
        'unit-7': { global: 6, ancestor: 4, local: 1, parentName: 'alf', ancestorName: 'alf' },
        'unit-8': { global: 7, ancestor: 2, local: 2, parentName: 'root', ancestorName: 'root' },
        'unit-9': { global: 8, ancestor: 0, local: 0, parentName: 'ellie', ancestorName: 'ellie' },
        'unit-10': { global: 9, ancestor: 1, local: 0, parentName: 'fred', ancestorName: 'ellie' }
      };

      for (let i = 0; i < 11; i++) {
        // eslint-disable-next-line @typescript-eslint/dot-notation
        const result = TestSessionService['getCurrent'](exampleBooklet.units, `unit-${i}`);
        const expectation = expectations[`unit-${i}`];

        expect(result.indexGlobal)
          .withContext(`global index of unit-${i}`)
          .toEqual(expectation.global);
        expect(result.indexAncestor)
          .withContext(`ancestor-index of unit-${i}`)
          .toEqual(expectation.ancestor);
        expect(result.indexLocal)
          .withContext(`local index of unit-${i}`)
          .toEqual(expectation.local);

        if ('parentName' in expectation) {
          expect(result.unit.id)
            .withContext(`featured unit of unit-${i}`)
            .toEqual(`unit-${i}`);
          expect(result.parent.id)
            .withContext(`parent of unit-${i}`)
            .toEqual(expectation.parentName);
          expect(result.ancestor.id)
            .withContext(`ancestor of unit-${i}`)
            .toEqual(expectation.ancestorName);
        } else {
          expect(result.unit)
            .withContext(`not found unit-${i}`)
            .toBeNull();
          expect(result.parent)
            .withContext(`no parent of unit-${i}`)
            .toBeNull();
        }
      }
    });
  });

  describe('stateString()', () => {
    it('should merge state object values if available', () => {
      const stateObject = {
        first_key: 'first_value',
        second_key: 'second_value'
      };

      let result = TestSessionService.stateString(stateObject, ['first_key'], '|');
      let expectation = 'first_value';
      expect(result).withContext('one existing value').toEqual(expectation);

      result = TestSessionService.stateString(stateObject, ['first_key', 'second_key'], '|');
      expectation = 'first_value|second_value';
      expect(result).withContext('two existing values').toEqual(expectation);

      result = TestSessionService.stateString(stateObject, ['first_key', 'second_key', 'not_existing'], '|');
      expectation = 'first_value|second_value';
      expect(result).withContext('two existing values and one not existing').toEqual(expectation);
    });
  });

  describe('hasState()', () => {
    it('should check correctly if state is in state-object', () => {
      const stateObject = {
        first_key: 'first_value',
        second_key: null
      };

      let result = TestSessionService.hasState(stateObject, 'first_key', 'first_value');
      expect(result).withContext('key exists and has value').toBeTrue();

      result = TestSessionService.hasState(stateObject, 'first_key', 'something_else');
      expect(result).withContext('key exists and not has value').toBeFalse();

      result = TestSessionService.hasState(stateObject, 'first_key');
      expect(result).withContext('key exists').toBeTrue();

      result = TestSessionService.hasState(stateObject, 'non_existing_key');
      expect(result).withContext('key exists not').toBeFalse();
    });
  });

  describe('parseJsonState()', () => {
    xit('should parse an string containing a state-object', () => {
      // TOOD implement unit-test
    });
  });

  describe('getMode()', () => {
    xit('should transform mode-string into label', () => {
      // TOOD implement unit-test
    });
  });
});
