import { Injectable } from '@angular/core';
import {
  BehaviorSubject, combineLatest, Observable, Subject, zip
} from 'rxjs';
import { Sort } from '@angular/material/sort';
import {
  delay, flatMap, map, switchMap, tap
} from 'rxjs/operators';
import { BackendService } from './backend.service';
import { BookletService } from './booklet.service';
import { TestSessionService } from './test-session.service';
import {
  isBooklet,
  Selection, CheckingOptions,
  TestSession,
  TestSessionFilter, TestSessionSetStats,
  TestSessionsSuperStates, CommandResponse
} from './group-monitor.interfaces';
import { ConnectionStatus } from '../shared/websocket-backend.service';

/**
 * func:
 * # checkAll
 * # stop / resume usw. ohne erlaubnis-check! sonst macht alwaysAll keinen Sinn
 * # customText und alert kombinieren!
 * + automatisch den nächsten wählen (?)
 * # problem beim markieren
 * # remove filter by finish all
 * - goto alias'd unit geht nicht! -> stimmt nicht
 * - select all checkbox ist zunächst angewählt
 * - anazhal der aufgaben iom block stimmt nicht
 * - unter-testlet lässt sich auswählen!
 * # kombinierte hintergrundfarben
 * tidy:
 * # was geben die commands zurück?
 * # wie wird alles reseted?
 * test
 * polish:
 * - design
 * - naming
 * - tests
 */

@Injectable()
export class GroupMonitorService {
  sortBy$: Subject<Sort>;
  filters$: Subject<TestSessionFilter[]>;
  checkingOptions: CheckingOptions;

  connectionStatus$: Observable<ConnectionStatus>;

  private groupName: string;

  get sessions$(): Observable<TestSession[]> {
    return this._sessions$.asObservable();
  }

  get sessions(): TestSession[] {
    return this._sessions$.getValue();
  }

  get checked(): TestSession[] { // this is intentionally not an observable
    return Object.values(this._checked);
  }

  get sessionsStats$(): Observable<TestSessionSetStats> {
    return this._sessionsStats$.asObservable();
  }

  get checkedStats$(): Observable<TestSessionSetStats> {
    return this._checkedStats$.asObservable();
  }

  get commandResponses$(): Observable<CommandResponse> {
    return this._commandResponses$.asObservable();
  }

  private monitor$: Observable<TestSession[]>;
  private _sessions$: BehaviorSubject<TestSession[]>;
  private _checked: { [sessionTestSessionId: number]: TestSession } = {};
  private _checkedStats$: BehaviorSubject<TestSessionSetStats>;
  private _sessionsStats$: BehaviorSubject<TestSessionSetStats>;
  private _commandResponses$: Subject<CommandResponse>;

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
    this.checkingOptions = {
      disableAutoCheckAll: true,
      autoCheckAll: true
    };

    this._checkedStats$ = new BehaviorSubject<TestSessionSetStats>(GroupMonitorService.getEmptyStats());
    this._sessionsStats$ = new BehaviorSubject<TestSessionSetStats>(GroupMonitorService.getEmptyStats());
    this._commandResponses$ = new Subject<CommandResponse>();

    this.monitor$ = this.bs.observeSessionsMonitor()
      .pipe(
        switchMap(sessions => zip(...sessions
          .map(session => this.bookletService.getBooklet(session.bookletName)
            .pipe(
              map(booklet => TestSessionService.analyzeTestSession(session, booklet))
            ))))
      );

    this._sessions$ = new BehaviorSubject<TestSession[]>([]);
    combineLatest<[Sort, TestSessionFilter[], TestSession[]]>([this.sortBy$, this.filters$, this.monitor$])
      .pipe(
        // eslint-disable-next-line max-len
        map(([sortBy, filters, sessions]) => this.sortSessions(sortBy, GroupMonitorService.filterSessions(sessions, filters))),
        tap(sessions => this.synchronizeChecked(sessions))
      )
      .subscribe(this._sessions$);

    this.connectionStatus$ = this.bs.connectionStatus$;
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

  private static getEmptyStats(): TestSessionSetStats {
    return {
      ...{
        all: false,
        number: 0,
        differentBookletSpecies: 0,
        differentBooklets: 0,
        paused: 0,
        locked: 0
      }
    };
  }

  private synchronizeChecked(sessions: TestSession[]): void {
    const sessionsStats = this.getSessionSetStats(sessions);

    this.checkingOptions.disableAutoCheckAll = (sessionsStats.differentBookletSpecies < 2);

    if (!this.checkingOptions.disableAutoCheckAll) {
      this.checkingOptions.autoCheckAll = false;
    }

    const newCheckedSessions: { [sessionFullId: number]: TestSession } = {};
    sessions
      .forEach(session => {
        if (this.checkingOptions.autoCheckAll || (typeof this._checked[session.id] !== 'undefined')) {
          newCheckedSessions[session.id] = session;
        }
      });
    this._checked = newCheckedSessions;

    this._checkedStats$.next(this.getSessionSetStats(Object.values(this._checked)));
    this._sessionsStats$.next(sessionsStats);
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
    if (!testIds.length) {
      this._commandResponses$.next({ commandType: 'resume', testIds });
      return;
    }
    this.bs.command('resume', [], testIds).subscribe(
      response => this._commandResponses$.next(response)
    );
  }

  testCommandPause(): void {
    const testIds = this.checked
      .filter(session => !TestSessionService.isPaused(session))
      .map(session => session.data.testId);
    if (!testIds.length) {
      this._commandResponses$.next({ commandType: 'pause', testIds });
      return;
    }
    this.bs.command('pause', [], testIds).subscribe(
      response => this._commandResponses$.next(response)
    );
  }

  testCommandGoto(selection: Selection): void {
    const allTestIds: number[] = [];
    const groupedByBooklet: {
      [bookletName: string]: {
        testIds: number[],
        firstUnitId: string
      }
    } = {};

    this.checked.forEach(session => {
      allTestIds.push(session.data.testId);
      if (!groupedByBooklet[session.data.bookletName] && isBooklet(session.booklet)) {
        const firstUnit = BookletService.getFirstUnitOfBlock(selection.element.blockId, session.booklet);
        if (firstUnit) {
          groupedByBooklet[session.data.bookletName] = {
            testIds: [],
            firstUnitId: firstUnit.id
          };
        }
      }
      groupedByBooklet[session.data.bookletName].testIds.push(session.data.testId);
      return groupedByBooklet;
    });

    zip(
      ...Object.keys(groupedByBooklet)
        .map(key => this.bs.command('goto', ['id', groupedByBooklet[key].firstUnitId], groupedByBooklet[key].testIds))
    ).subscribe(() => {
      this._commandResponses$.next({
        commandType: 'goto',
        testIds: allTestIds
      });
    });
  }

  testCommandUnlock(): void {
    const testIds = this.checked
      .filter(TestSessionService.isLocked)
      .map(session => session.data.testId);
    if (!testIds.length) {
      this._commandResponses$.next({ commandType: 'unlock', testIds });
      return;
    }
    this.bs.unlock(this.groupName, testIds).subscribe(
      response => this._commandResponses$.next(response)
    );
  }

  isChecked(session: TestSession): boolean {
    return (typeof this._checked[session.id] !== 'undefined');
  }

  checkSessionsBySelection(selected: Selection): void {
    if (this.checkingOptions.autoCheckAll) {
      return;
    }
    let toCheck: TestSession[] = [];
    if (selected.element) {
      if (!selected.spreading) {
        toCheck = [selected.originSession];
      } else {
        toCheck = this._sessions$.getValue()
          .filter(session => (session.booklet.species === selected.originSession.booklet.species))
          .filter(session => (selected.inversion ? !this.isChecked(session) : true));
      }
    }

    this.replaceCheckedSessions(toCheck);
  }

  invertChecked(): void {
    if (this.checkingOptions.autoCheckAll) {
      return;
    }
    const unChecked = this._sessions$.getValue()
      .filter(session => session.data.testId && session.data.testId > -1)
      .filter(session => !this.isChecked(session));
    this.replaceCheckedSessions(unChecked);
  }

  checkSession(session: TestSession): void {
    if (this.checkingOptions.autoCheckAll) {
      return;
    }
    this._checked[session.id] = session;
    this.onCheckedChanged();
  }

  uncheckSession(session: TestSession): void {
    if (this.checkingOptions.autoCheckAll) {
      return;
    }
    if (this.isChecked(session)) {
      delete this._checked[session.id];
    }
    this.onCheckedChanged();
  }

  checkAll(): void {
    if (this.checkingOptions.autoCheckAll) {
      return;
    }
    this.replaceCheckedSessions(this._sessions$.getValue());
  }

  checkNone(): void {
    if (this.checkingOptions.autoCheckAll) {
      return;
    }
    this.replaceCheckedSessions([]);
  }

  private replaceCheckedSessions(sessionsToCheck: TestSession[]): void {
    const newCheckedSessions = {};
    sessionsToCheck
      .forEach(session => { newCheckedSessions[session.id] = session; });
    this._checked = newCheckedSessions;
    this.onCheckedChanged();
  }

  private onCheckedChanged(): void {
    this._checkedStats$.next(this.getSessionSetStats(this.checked));
  }

  getSessionSetStats(sessionSet: TestSession[]): TestSessionSetStats { // TODO only private for test
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

  finishEverything(): Observable<CommandResponse> {
    const getUnlockedConnectedTestIds = () => Object.values(this._sessions$.getValue())
      .filter(session => !TestSessionService.hasState(session.data.testState, 'status', 'locked') &&
                         !TestSessionService.hasState(session.data.testState, 'CONTROLLER', 'TERMINATED') &&
                         (TestSessionService.hasState(session.data.testState, 'CONNECTION', 'POLLING') ||
                         TestSessionService.hasState(session.data.testState, 'CONNECTION', 'WEBSOCKET')))
      .map(session => session.data.testId);
    const getUnlockedTestIds = () => Object.values(this._sessions$.getValue())
      .filter(session => session.data.testId > 0)
      .filter(session => !TestSessionService.hasState(session.data.testState, 'status', 'locked'))
      .map(session => session.data.testId);

    this.filters$.next([]);

    return this.bs.command('terminate', [], getUnlockedConnectedTestIds())
      .pipe(
        delay(1900),
        flatMap(() => this.bs.lock(this.groupName, getUnlockedTestIds()))
      );
  }
}
