import { Injectable } from '@angular/core';
import {
  BehaviorSubject, combineLatest, Observable, Subject, Subscription, zip
} from 'rxjs';
import { Sort } from '@angular/material/sort';
import { map, switchMap, tap } from 'rxjs/operators';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { BackendService } from './backend.service';
import { BookletService } from './booklet.service';
import { TestSessionService } from './test-session.service';
import {
  isBooklet,
  Selection,
  TestSession,
  TestSessionFilter, TestSessionSetStats,
  TestSessionsSuperStates
} from './group-monitor.interfaces';

/**
 * fragen:
 * - was geben die commands zurück?
 * - wie wird alles reseted?
 * - is*alloweed sollte on checkedChanges ermittelt werden
 * - sollte checkedSessions ein observable sein? (hint: ja)
 */

@Injectable()
export class GroupMonitorService {
  sortBy$: Subject<Sort>;
  filters$: Subject<TestSessionFilter[]>;
  private groupName: string;

  get sessions$(): Observable<TestSession[]> {
    return this.allSessions$.asObservable();
  }

  get sessions(): TestSession[] {
    return this.allSessions$.getValue();
  }

  get checked(): TestSession[] {
    return Object.values(this.checkedSessions);
  }

  get checkedSessionsInfo(): TestSessionSetStats {
    return this.checkedSessionsInfo$.getValue();
  }

  private allSessions$: BehaviorSubject<TestSession[]>;
  private monitor$: Observable<TestSession[]>;

  checkedSessions: { [sessionTestSessionId: number]: TestSession } = {};

  readonly checkedSessionsInfo$: BehaviorSubject<TestSessionSetStats> = new BehaviorSubject<TestSessionSetStats>({
    all: false,
    number: 0,
    differentBookletSpecies: 0,
    differentBooklets: 0,
    paused: 0,
    locked: 0
  });

  readonly allSessionsInfo$: BehaviorSubject<TestSessionSetStats> = new BehaviorSubject<TestSessionSetStats>({
    all: false,
    number: 0,
    differentBookletSpecies: 0,
    differentBooklets: 0,
    paused: 0,
    locked: 0
  });

  filterOptions: { label: string, filter: TestSessionFilter, selected: boolean }[] = [
    {
      label: 'gesperrte',
      selected: false,
      filter: {
        type: 'testState',
        value: 'status',
        subValue: 'locked'
      }
    },
    {
      label: 'nicht gestartete',
      selected: false,
      filter: {
        type: 'testState',
        value: 'status',
        subValue: 'pending'
      }
    }
  ];

  constructor(
    private bs: BackendService,
    private bookletService: BookletService
  ) {}

  connect(groupName: string): void {
    this.groupName = groupName;
    this.sortBy$ = new BehaviorSubject<Sort>({ direction: 'asc', active: 'personLabel' });
    this.filters$ = new BehaviorSubject<TestSessionFilter[]>([]);

    this.monitor$ = this.bs.observeSessionsMonitor()
      .pipe(
        switchMap(sessions => zip(...sessions
          .map(session => this.bookletService.getBooklet(session.bookletName)
            .pipe(
              map(booklet => TestSessionService.analyzeTestSession(session, booklet))
            ))))
      );

    this.allSessions$ = new BehaviorSubject<TestSession[]>([]);
    combineLatest<[Sort, TestSessionFilter[], TestSession[]]>([this.sortBy$, this.filters$, this.monitor$])
      .pipe(
        // eslint-disable-next-line max-len
        map(([sortBy, filters, sessions]) => this.sortSessions(sortBy, GroupMonitorService.filterSessions(sessions, filters))),
        tap(sessions => this.updateEverything(sessions))
      )
      .subscribe(this.allSessions$);
  }

  disconnect(): void {
    this.groupName = undefined;
    this.bs.cutConnection();
  }

  switchFilter(indexInFilterOptions: number): void {
    this.filterOptions[indexInFilterOptions].selected =
      !this.filterOptions[indexInFilterOptions].selected;
    this.filters$.next(
      this.filterOptions
        .filter(filterOption => filterOption.selected)
        .map(filterOption => filterOption.filter)
    );
  }

  private static filterSessions(sessions: TestSession[], filters: TestSessionFilter[]): TestSession[] {
    return sessions
      .filter(session => session.data.testId && session.data.testId > -1) // testsession without testId is deprecated
      .filter(session => GroupMonitorService.applyFilters(session, filters));
  }

  private static applyFilters(session: TestSession, filters: TestSessionFilter[]): boolean {
    const applyNot = (isMatching, not: boolean): boolean => (not ? !isMatching : isMatching);
    return filters.reduce((keep: boolean, nextFilter: TestSessionFilter) => {
      switch (nextFilter.type) {
        case 'groupName': {
          return keep && applyNot(session.data.groupName !== nextFilter.value, nextFilter.not);
        }
        case 'bookletName': {
          return keep && applyNot(session.data.bookletName !== nextFilter.value, nextFilter.not);
        }
        case 'testState': {
          const keyExists = (typeof session.data.testState[nextFilter.value] !== 'undefined');
          const valueMatches = keyExists && (session.data.testState[nextFilter.value] === nextFilter.subValue);
          const keepIn = (typeof nextFilter.subValue !== 'undefined') ? !valueMatches : !keyExists;
          return keep && applyNot(keepIn, nextFilter.not);
        }
        case 'mode': {
          return keep && applyNot(session.data.mode !== nextFilter.value, nextFilter.not);
        }
        default:
          return false;
      }
    }, true);
  }

  private updateEverything(sessions: TestSession[]): void { // TODo naming
    const newCheckedSessions: { [sessionFullId: number]: TestSession } = {};
    sessions
      .forEach(session => {
        if (typeof this.checkedSessions[session.id] !== 'undefined') {
          newCheckedSessions[session.id] = session;
        }
      });
    this.checkedSessions = newCheckedSessions;
    this.allSessionsInfo$.next(this.getSessionSetStats(this.sessions));
  }

  sortSessions(sort: Sort, sessions: TestSession[]): TestSession[] {
    return sessions
      .sort((session1, session2) => {
        const sortDirectionFactor = (sort.direction === 'asc' ? 1 : -1);
        if (sort.active === 'timestamp') {
          return (session1.data.timestamp - session2.data.timestamp) * sortDirectionFactor;
        }
        if (sort.active === '_checked') {
          const session1isChecked = this.isChecked(session1);
          const session2isChecked = this.isChecked(session2);
          if (!session1isChecked && session2isChecked) {
            return 1 * sortDirectionFactor;
          }
          if (session1isChecked && !session2isChecked) {
            return -1 * sortDirectionFactor;
          }
          return 0;
        }
        if (sort.active === '_superState') {
          return (TestSessionsSuperStates.indexOf(session1.state) -
            TestSessionsSuperStates.indexOf(session2.state)) * sortDirectionFactor;
        }
        if (sort.active === '_currentBlock') {
          const s1curBlock = session1.current && session1.current.parent ? session1.current.parentIndexGlobal : 100000;
          const s2curBlock = session2.current && session2.current.parent ? session2.current.parentIndexGlobal : 100000;
          return (s1curBlock - s2curBlock) * sortDirectionFactor;
        }
        if (sort.active === '_currentUnit') {
          const s1currentUnit = session1.current ? session1.current.unit.label : 'zzzzzzzzzz';
          const s2currentUnit = session2.current ? session2.current.unit.label : 'zzzzzzzzzz';
          return s1currentUnit.localeCompare(s2currentUnit) * sortDirectionFactor;
        }
        const stringA = (session1.data[sort.active] || 'zzzzzzzzzz');
        const stringB = (session2.data[sort.active] || 'zzzzzzzzzz');
        return stringA.localeCompare(stringB) * sortDirectionFactor;
      });
  }

  testCommandResume(): void {
    const testIds = this.checked
      .filter(TestSessionService.isPaused)
      .map(session => session.data.testId);
    this.bs.command('resume', [], testIds);
  }

  testCommandPause(): void {
    const testIds = this.checked
      .filter(session => !TestSessionService.isPaused(session))
      .map(session => session.data.testId);
    this.bs.command('pause', [], testIds);
  }

  testCommandGoto(selection: Selection): void {
    interface BookletToGotoMap {
      [bookletName: string]: {
        sessionIds: number[],
        firstUnitId: string
      }
    }

    const groupedByBooklet: BookletToGotoMap = this.checked
      .reduce((agg: BookletToGotoMap, session): BookletToGotoMap => {
        if (!agg[session.data.bookletName] && isBooklet(session.booklet)) {
          const firstUnit = BookletService.getFirstUnitOfBlock(selection.element.blockId, session.booklet);
          if (firstUnit) {
            agg[session.data.bookletName] = {
              sessionIds: [],
              firstUnitId: firstUnit.id
            };
          }
        }
        agg[session.data.bookletName].sessionIds.push(session.data.testId);
        return agg;
      }, {});

    Object.keys(groupedByBooklet)
      .forEach(booklet => {
        this.bs.command('goto', ['id', groupedByBooklet[booklet].firstUnitId], groupedByBooklet[booklet].sessionIds);
      });
  }

  testCommandUnlock(): Subscription {
    const sessionIds = this.checked
      .filter(TestSessionService.isLocked)
      .map(session => session.data.testId);
    return this.bs.unlock(this.groupName, sessionIds);
  }

  checkSessionsBySelection(selected: Selection): void {
    let toCheck: TestSession[] = [];
    if (selected.element) {
      if (!selected.spreading) {
        toCheck = [selected.originSession];
      } else {
        toCheck = this.allSessions$.getValue()
          .filter(session => (session.booklet.species === selected.originSession.booklet.species))
          .filter(session => (selected.inversion ? !this.isChecked(session) : true));
      }
    }

    this.replaceCheckedSessions(toCheck);
  }

  toggleCheckAll(event: MatCheckboxChange): void {
    if (event.checked) {
      this.replaceCheckedSessions(
        this.allSessions$.getValue()
          .filter(session => session.data.testId && session.data.testId > -1)
      );
    } else {
      this.replaceCheckedSessions([]);
    }
  }

  invertChecked(event: Event): boolean { // TODO move back to component
    event.preventDefault();
    const unChecked = this.allSessions$.getValue()
      .filter(session => session.data.testId && session.data.testId > -1)
      .filter(session => !this.isChecked(session));
    this.replaceCheckedSessions(unChecked);
    return false;
  }

  isChecked(session: TestSession): boolean {
    return (typeof this.checkedSessions[session.id] !== 'undefined');
  }

  checkSession(session: TestSession): void {
    this.checkedSessions[session.id] = session;
  }

  uncheckSession(session: TestSession): void {
    if (this.isChecked(session)) {
      delete this.checkedSessions[session.id];
    }
  }

  private replaceCheckedSessions(sessionsToCheck: TestSession[]): void {
    const newCheckedSessions = {};
    sessionsToCheck
      .forEach(session => { newCheckedSessions[session.id] = session; });
    this.checkedSessions = newCheckedSessions;
    this.onCheckedChanged();
  }

  onCheckedChanged(): void {
    this.checkedSessionsInfo$.next(this.getSessionSetStats(this.checked));
  }

  getSessionSetStats(sessionSet: TestSession[]): TestSessionSetStats {
    const booklets = new Set();
    const bookletSpecies = new Set();
    let paused = 0;
    let locked = 0;

    sessionSet
      .forEach(session => {
        booklets.add(session.data.bookletName);
        bookletSpecies.add(session.booklet.species);
        if (TestSessionService.isPaused(session)) paused += 1;
        if (TestSessionService.isLocked(session)) locked += 1;
      });

    return {
      number: sessionSet.length,
      differentBooklets: booklets.size,
      differentBookletSpecies: bookletSpecies.size,
      all: (this.sessions.length === sessionSet.length),
      paused,
      locked
    };
  }

  finishEverything(): Subscription {
    // TODO was ist hier mit gefilterten sessions?!
    const getUnlockedConnectedTestIds = () => Object.values(this.allSessions$.getValue())
      .filter(session => !TestSessionService.hasState(session.data.testState, 'status', 'locked') &&
                         !TestSessionService.hasState(session.data.testState, 'CONTROLLER', 'TERMINATED') &&
                         (TestSessionService.hasState(session.data.testState, 'CONNECTION', 'POLLING') ||
                         TestSessionService.hasState(session.data.testState, 'CONNECTION', 'WEBSOCKET')))
      .map(session => session.data.testId);
    const getUnlockedTestIds = () => Object.values(this.allSessions$.getValue())
      .filter(session => session.data.testId > 0)
      .filter(session => !TestSessionService.hasState(session.data.testState, 'status', 'locked'))
      .map(session => session.data.testId);

    return this.bs.command('terminate', [], getUnlockedConnectedTestIds()) // kill running tests
      .add(() => {
        setTimeout(() => this.bs.lock(this.groupName, getUnlockedTestIds()), 2000); // lock everything
      });
  }
}
