import {
  Component, ElementRef, OnDestroy, OnInit, ViewChild
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { MatSidenav } from '@angular/material/sidenav';
import { MatCheckboxChange } from '@angular/material/checkbox';
import {
  BehaviorSubject, combineLatest, Observable, Subject, Subscription
} from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { BackendService } from './backend.service';
import {
  GroupData,
  TestSession,
  TestViewDisplayOptions,
  TestViewDisplayOptionKey, Testlet, Unit, isUnit, Selected, TestSessionFilter
} from './group-monitor.interfaces';
import { ConnectionStatus } from '../shared/websocket-backend.service';

@Component({
  selector: 'app-group-monitor',
  templateUrl: './group-monitor.component.html',
  styleUrls: ['./group-monitor.component.css']
})
export class GroupMonitorComponent implements OnInit, OnDestroy {
  constructor(
    private route: ActivatedRoute,
    private bs: BackendService
  ) {}

  ownGroup$: Observable<GroupData>;

  monitor$: Observable<TestSession[]>;
  connectionStatus$: Observable<ConnectionStatus>;
  sortBy$: Subject<Sort>;
  filters$: Subject<TestSessionFilter[]>;
  sessions$: BehaviorSubject<TestSession[]>;

  displayOptions: TestViewDisplayOptions = {
    view: 'full',
    groupColumn: 'hide',
    bookletColumn: 'hide',
    selectionMode: 'block',
    selectionSpreading: 'booklet'
  };

  filterOptions: {label: string, filter: TestSessionFilter, selected: boolean}[] = [
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
      label: 'nicht aktive',
      selected: false,
      filter: {
        type: 'testState',
        value: 'CONTROLLER',
        subValue: 'RUNNING',
        not: true
      }
    }
  ];

  selectedElement: Selected = {
    session: null,
    element: undefined,
    spreading: false
  };

  markedElement: Testlet|Unit|null = null;
  checkedSessions: {[sessionTestSessionId: number]: TestSession} = {};
  allSessionsChecked = false;
  sessionCheckedGroupCount: number;

  isScrollable = false;
  @ViewChild('adminbackground') mainElem:ElementRef;

  private routingSubscription: Subscription = null;

  @ViewChild('sidenav', {static: true}) sidenav: MatSidenav;

  static getFirstUnit(testletOrUnit: Testlet|Unit): Unit|null {
    while (!isUnit(testletOrUnit)) {
      if (!testletOrUnit.children.length) {
        return null;
      }
      testletOrUnit = testletOrUnit.children[0];
    }
    return testletOrUnit;
  }

  private static getPersonXTestId(session: TestSession): number {
    return session.personId * 10000 +  session.testId;
  }

  private static hasState(state: object, key: string, value: any = null): boolean {
    return ((typeof state[key] !== 'undefined') && ((value !== null) ? (state[key] === value) : true));
  }

  ngOnInit(): void {
    this.routingSubscription = this.route.params.subscribe(params => {
      this.ownGroup$ = this.bs.getGroupData(params['group-name']);
    });

    this.sortBy$ = new BehaviorSubject<Sort>({direction: 'asc', active: 'personLabel'});
    this.filters$ = new BehaviorSubject<TestSessionFilter[]>([]);

    this.monitor$ = this.bs.observeSessionsMonitor();

    this.sessions$ = new BehaviorSubject<TestSession[]>([]);

    combineLatest<[Sort, TestSessionFilter[], TestSession[]]>([this.sortBy$, this.filters$, this.monitor$])
      .pipe(
          map(([sortBy, filters, sessions]) => this.sortSessions(sortBy, this.filterSessions(sessions, filters))),
          tap(sessions => this.updateChecked(sessions))
      )
      .subscribe(this.sessions$);

    this.connectionStatus$ = this.bs.connectionStatus$;
  }

  ngOnDestroy(): void {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
    this.bs.cutConnection();
  }

  switchFilter(indexInFilterOptions: number) {
    this.filterOptions[indexInFilterOptions].selected = !this.filterOptions[indexInFilterOptions].selected;
    this.filters$.next(
        this.filterOptions
          .filter(filterOption => filterOption.selected)
          .map(filterOption => filterOption.filter)
    );
  }

  private filterSessions(sessions: TestSession[], filters: TestSessionFilter[]): TestSession[] {
    return sessions.filter((session) => this.applyFilters(session, filters));
  }

  private applyFilters(session: TestSession, filters: TestSessionFilter[]): boolean {
    const applyNot = (isMatching, not: boolean): boolean => not ? !isMatching : isMatching;
    return filters.reduce((keep: boolean, nextFilter: TestSessionFilter) => {
      switch (nextFilter.type) {
        case 'groupName': {
          return keep && applyNot(session.groupName !== nextFilter.value, nextFilter.not);
        }
        case 'bookletName': {
          return keep && applyNot(session.bookletName !== nextFilter.value, nextFilter.not);
        }
        case 'testState': {
          const keyExists = (typeof session.testState[nextFilter.value] !== 'undefined');
          const valueMatches = keyExists && (session.testState[nextFilter.value] === nextFilter.subValue);
          const keepIn = (typeof nextFilter.subValue !== 'undefined') ? !valueMatches : !keyExists;
          return keep && applyNot(keepIn, nextFilter.not);
        }
        case 'mode': {
          return keep && applyNot(session.mode !== nextFilter.value, nextFilter.not);
        }
      }
    }, true);
  }

  private updateChecked(sessions: TestSession[]): void {
    const newCheckedSessions: {[sessionFullId: number]: TestSession} = {};
    sessions
      .forEach((session) => {
        const sessionFullId = GroupMonitorComponent.getPersonXTestId(session);
        if (typeof this.checkedSessions[sessionFullId] !== 'undefined') {
          newCheckedSessions[sessionFullId] = session;
        }
      });
    this.checkedSessions = newCheckedSessions;
  }

  trackSession(index: number, session: TestSession): number {
    return GroupMonitorComponent.getPersonXTestId(session);
  }

  sortSessions(sort: Sort, sessions: TestSession[]): TestSession[] {
    return sessions
        .sort((testSession1, testSession2) => {
          if (sort.active === 'timestamp') {
            return (testSession2.timestamp - testSession1.timestamp) * (sort.direction === 'asc' ? 1 : -1);
          }
          if (sort.active === 'selected') {
            return (this.isChecked(testSession1) === this.isChecked(testSession2) ? 0 : this.isChecked(testSession1) ? 1 : -1)
                * (sort.direction === 'asc' ? -1 : 1);
          }
          const stringA = (testSession1[sort.active] || 'zzzzz');
          const stringB = (testSession2[sort.active] || 'zzzzz');
          return stringA.localeCompare(stringB) * (sort.direction === 'asc' ? 1 : -1);
        });
  }

  setTableSorting(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      return;
    }
    this.sortBy$.next(sort);
  }

  setDisplayOption(option: string, value: TestViewDisplayOptions[TestViewDisplayOptionKey]): void {
    this.displayOptions[option] = value;
  }

  testCommandResume() {
    const testIds = Object.values(this.checkedSessions)
      .filter((session) => session.testId && session.testId > -1)
      .filter((session) => GroupMonitorComponent.hasState(session.testState, 'status', 'running'))
      .filter((session) => GroupMonitorComponent.hasState(session.testState, 'CONTROLLER', 'PAUSED'))
      .map((session) => session.testId);
    this.bs.command('resume', [], testIds);
  }

  testCommandPause() {
    const testIds = Object.values(this.checkedSessions)
      .filter((session) => session.testId && session.testId > -1)
      .filter((session) => GroupMonitorComponent.hasState(session.testState, 'status', 'running'))
      .filter((session) => !GroupMonitorComponent.hasState(session.testState, 'CONTROLLER', 'PAUSED'))
      .map((session) => session.testId);
    this.bs.command('pause', [], testIds);
  }

  testCommandGoto() {
    if ((this.sessionCheckedGroupCount === 1) && (Object.keys(this.checkedSessions).length > 0)) {
      const testIds = Object.values(this.checkedSessions)
        .filter((session) => session.testId && session.testId > -1)
        .map((session) => session.testId);
      this.bs.command('goto', ['id', GroupMonitorComponent.getFirstUnit(this.selectedElement.element).id], testIds);
    }
  }

  selectElement(selected: Selected) {
    this.selectedElement = selected;
    let toCheck: TestSession[] = [];
    if (selected.element) {
      if (!selected.spreading) {
        toCheck = [selected.session];
      } else {
        // TODO the 2nd filter should depend on this.displayOptions.selectionSpreading is 'all' or 'booklet' ...
        // ... can be implemented if it's clear how to broadcast commands to different targets
        toCheck = this.sessions$.getValue()
            .filter(session => session.testId && session.testId > -1)
            .filter(session => session.bookletName === selected.session.bookletName)
            .filter(session => selected.inversion ? !this.isChecked(session) : true);
      }
    }
    this.replaceCheckedSessions(toCheck);
  }

  markElement(testletOrUnit: Testlet|Unit|null) {
    this.markedElement = testletOrUnit;
  }

  toggleChecked(checked: boolean, session: TestSession) {
    if (!this.isChecked(session)) {
      this.checkSession(session);
    } else {
      this.uncheckSession(session);
    }
    this.onCheckedChanged();
  }

  toggleCheckAll(event: MatCheckboxChange) {
    if (event.checked) {
      this.replaceCheckedSessions(
          this.sessions$.getValue()
              .filter(session => session.testId && session.testId > -1)
      );
    } else {
      this.replaceCheckedSessions([]);
    }
  }

  invertChecked(event: Event): boolean {
    event.preventDefault();
    const unChecked = this.sessions$.getValue()
      .filter((session) => session.testId && session.testId > -1)
      .filter((session) => !this.isChecked(session));
    this.replaceCheckedSessions(unChecked);
    return false;
  }

  countCheckedSessions(): number {
    return Object.values(this.checkedSessions).length;
  }

  isChecked(session: TestSession): boolean {
    return (typeof this.checkedSessions[GroupMonitorComponent.getPersonXTestId(session)] !== 'undefined');
  }

  private checkSession(session: TestSession) {
    this.checkedSessions[GroupMonitorComponent.getPersonXTestId(session)] = session;
  }

  private uncheckSession(session: TestSession) {
    if (this.isChecked(session)) {
      delete this.checkedSessions[GroupMonitorComponent.getPersonXTestId(session)];
    }
  }

  private replaceCheckedSessions(sessionsToCheck: TestSession[]) {
    const newCheckedSessions = {};
    sessionsToCheck
      .forEach((session) => newCheckedSessions[GroupMonitorComponent.getPersonXTestId(session)] = session);
    this.checkedSessions = newCheckedSessions;
    this.onCheckedChanged();
  }

  private onCheckedChanged() {
    this.sessionCheckedGroupCount = Object.values(this.checkedSessions)
      .map((session) => session.bookletName)
      .filter((value, index, self) => self.indexOf(value) === index)
      .length;
    const checkableSessions = this.sessions$.getValue().filter(session => session.testId && session.testId > -1);
    this.allSessionsChecked = (checkableSessions.length === this.countCheckedSessions());
    if (this.sessionCheckedGroupCount > 1) {
      this.selectedElement = null;
    }
  }

  isPauseAllowed(): boolean {
    const activeSessions = Object.values(this.checkedSessions).length && Object.values(this.checkedSessions)
      .filter((session) => GroupMonitorComponent.hasState(session.testState, 'status', 'running'));
    return activeSessions.length && activeSessions
        .filter(session => GroupMonitorComponent.hasState(session.testState, 'status', 'running'))
        .filter(session => GroupMonitorComponent.hasState(session.testState, 'CONTROLLER', 'PAUSED'))
        .length === 0;
  }

  isResumeAllowed() {
    const activeSessions = Object.values(this.checkedSessions)
      .filter((session) => GroupMonitorComponent.hasState(session.testState, 'status', 'running'));
    return activeSessions.length && activeSessions
      .filter((session) => !GroupMonitorComponent.hasState(session.testState, 'CONTROLLER', 'PAUSED'))
      .length === 0;
  }

  ngAfterViewChecked() {
    this.isScrollable = this.mainElem.nativeElement.clientHeight < this.mainElem.nativeElement.scrollHeight;
  }

  scrollDown() {
    this.mainElem.nativeElement.scrollTo(0, this.mainElem.nativeElement.scrollHeight);
  }

  updateScrollHint() {
    const elem = this.mainElem.nativeElement;
    const reachedBottom = (elem.scrollTop + elem.clientHeight === elem.scrollHeight);
    elem.classList[reachedBottom ? 'add' : 'remove']('hide-scroll-hint');
  }
}
