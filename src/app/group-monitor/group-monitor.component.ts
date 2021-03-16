import {
  Component, ElementRef, OnDestroy, OnInit, ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Sort } from '@angular/material/sort';
import { MatSidenav } from '@angular/material/sidenav';
import { MatCheckboxChange } from '@angular/material/checkbox';
import {
  BehaviorSubject, combineLatest, Observable, of, Subject, Subscription, zip
} from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from 'iqb-components';
import { BackendService } from './backend.service';
import {
  GroupData,
  TestViewDisplayOptions,
  TestViewDisplayOptionKey, Testlet, Unit, Selected, TestSessionFilter, TestSession, TestSessionsSuperStates, isBooklet
} from './group-monitor.interfaces';
import { ConnectionStatus } from '../shared/websocket-backend.service';
import { TestSessionService } from './test-session.service';
import { BookletService } from './booklet.service';

@Component({
  selector: 'app-group-monitor',
  templateUrl: './group-monitor.component.html',
  styleUrls: ['./group-monitor.component.css']
})
export class GroupMonitorComponent implements OnInit, OnDestroy {
  constructor(
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private bs: BackendService,
    private bookletService: BookletService,
    private router: Router
  ) {}

  ownGroup$: Observable<GroupData>;
  private ownGroupName = '';

  monitor$: Observable<TestSession[]>;
  connectionStatus$: Observable<ConnectionStatus>;
  sortBy$: Subject<Sort>;
  filters$: Subject<TestSessionFilter[]>;
  sessions$: BehaviorSubject<TestSession[]>;

  displayOptions: TestViewDisplayOptions = {
    view: 'medium',
    groupColumn: 'hide',
    bookletColumn: 'show',
    blockColumn: 'show',
    unitColumn: 'hide',
    selectionSpreading: 'booklet'
  };

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

  selectedElement: Selected = {
    session: null,
    element: undefined,
    spreading: false
  };

  markedElement: Testlet|Unit|null = null;
  checkedSessions: { [sessionTestSessionId: number]: TestSession } = {};
  allSessionsChecked = false;
  sessionCheckedGroupCount: number;

  isScrollable = false;
  isClosing = false;

  warnings: { [key: string]: { text: string, timeout: number } } = {};

  @ViewChild('adminbackground') mainElem:ElementRef;
  @ViewChild('sidenav', { static: true }) sidenav: MatSidenav;

  private routingSubscription: Subscription = null;

  ngOnInit(): void {
    this.routingSubscription = this.route.params.subscribe(params => {
      this.ownGroup$ = this.bs.getGroupData(params['group-name']);
      this.ownGroupName = params['group-name'];
    });

    this.sortBy$ = new BehaviorSubject<Sort>({ direction: 'asc', active: 'personLabel' });
    this.filters$ = new BehaviorSubject<TestSessionFilter[]>([]);

    this.monitor$ = this.bs.observeSessionsMonitor()
      .pipe(
        switchMap(sessions => zip(...sessions
          .map(session => this.bookletService.getBooklet(session.bookletName)
            .pipe(map(booklet => TestSessionService.analyzeTestSession(session, booklet))))))
      );

    this.sessions$ = new BehaviorSubject<TestSession[]>([]);
    combineLatest<[Sort, TestSessionFilter[], TestSession[]]>([this.sortBy$, this.filters$, this.monitor$])
      .pipe(
        // eslint-disable-next-line max-len
        map(([sortBy, filters, sessions]) => this.sortSessions(sortBy, GroupMonitorComponent.filterSessions(sessions, filters))),
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
    return sessions.filter(session => GroupMonitorComponent.applyFilters(session, filters));
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

  private updateChecked(sessions: TestSession[]): void {
    const newCheckedSessions: { [sessionFullId: number]: TestSession } = {};
    sessions
      .forEach(session => {
        const sessionFullId = session.id;
        if (typeof this.checkedSessions[sessionFullId] !== 'undefined') {
          newCheckedSessions[sessionFullId] = session;
        }
      });
    this.checkedSessions = newCheckedSessions;
  }

  trackSession = (index: number, session: TestSession): number => session.id;

  sortSessions(sort: Sort, sessions: TestSession[]): TestSession[] { // STAND
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

  setTableSorting(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      return;
    }
    this.sortBy$.next(sort);
  }

  setDisplayOption(option: string, value: TestViewDisplayOptions[TestViewDisplayOptionKey]): void {
    this.displayOptions[option] = value;
  }

  testCommandResume(): void {
    const testIds = Object.values(this.checkedSessions)
      .filter(session => session.data.testId && session.data.testId > -1)
      .filter(session => TestSessionService.hasState(session.data.testState, 'status', 'running'))
      .filter(session => TestSessionService.hasState(session.data.testState, 'CONTROLLER', 'PAUSED'))
      .map(session => session.data.testId);
    this.bs.command('resume', [], testIds);
  }

  testCommandPause(): void {
    const testIds = Object.values(this.checkedSessions)
      .filter(session => session.data.testId && session.data.testId > -1)
      .filter(session => TestSessionService.hasState(session.data.testState, 'status', 'running'))
      .filter(session => !TestSessionService.hasState(session.data.testState, 'CONTROLLER', 'PAUSED'))
      .map(session => session.data.testId);
    this.bs.command('pause', [], testIds);
  }

  testCommandGoto(): void {
    if ((this.sessionCheckedGroupCount === 1) && (Object.keys(this.checkedSessions).length > 0)) {
      const testIds = Object.values(this.checkedSessions)
        .filter(session => session.data.testId && session.data.testId > -1)
        .map(session => session.data.testId);
      this.bs.command('goto', ['id', BookletService.getFirstUnit(this.selectedElement.element).id], testIds);
    }
  }

  testCommandUnlock(): void {
    const sessions = Object.values(this.checkedSessions)
      .filter(session => TestSessionService.hasState(session.data.testState, 'status', 'locked'));
    this.bs.unlock(this.ownGroupName, sessions.map(session => session.data.testId)).add(() => {
      const plural = sessions.length > 1;
      this.addWarning('reload-some-clients',
        `${plural ? sessions.length : 'Ein'} Test${plural ? 's' : ''} 
        wurde${plural ? 'n' : ''} entsperrt. ${plural ? 'Die' : 'Der'} Teilnehmer 
        ${plural ? 'müssen' : 'muss'} die Webseite aufrufen bzw. neuladen, 
        damit ${plural ? 'die' : 'der'} Test${plural ? 's' : ''} wieder aufgenommen werden kann!`);
    });
  }

  testCommandAllNext(): void {
    const sessionsWithNextUnit = this.sessions$.getValue()
      .filter(session => session.data.testId && session.data.bookletName && session.current)
      .map(session => {
        if (!isBooklet(session.booklet)) {
          return null;
        }
        const nextBlock = BookletService.getNextBlock(session.current, session.booklet);
        if (!nextBlock) {
          return null;
        }
        const nextBlockFirstUnit = BookletService.getFirstUnit(nextBlock);
        return { gotoId: nextBlockFirstUnit.id, session };
      })
      .filter(sessionAndUnit => !!sessionAndUnit);
    const commands = sessionsWithNextUnit
      .map(params => this.bs.command('goto', ['id', params.gotoId], [params.session.data.testId]));
    of(commands).subscribe(() => {
      this.replaceCheckedSessions(sessionsWithNextUnit.map(sessionAndUnit => sessionAndUnit.session));
    });
  }

  private addWarning(key, text): void {
    if (typeof this.warnings[key] !== 'undefined') {
      window.clearTimeout(this.warnings[key].timeout);
    }
    this.warnings[key] = {
      text,
      timeout: window.setTimeout(() => delete this.warnings[key], 30000)
    };
  }

  selectElement(selected: Selected): void {
    this.selectedElement = selected;
    let toCheck: TestSession[] = [];
    if (selected.element) {
      if (!selected.spreading) {
        toCheck = [selected.session];
      } else {
        // TODO the 2nd filter should depend on this.displayOptions.selectionSpreading is 'all' or 'booklet' ...
        // ... can be implemented if it's clear how to broadcast commands to different targets
        toCheck = this.sessions$.getValue()
          .filter(session => session.data.testId && session.data.testId > -1)
          .filter(session => session.data.bookletName === selected.session.data.bookletName)
          .filter(session => (selected.inversion ? !this.isChecked(session) : true));
      }
    }
    this.replaceCheckedSessions(toCheck);
  }

  markElement(testletOrUnit: Testlet|Unit|null): void {
    this.markedElement = testletOrUnit;
  }

  toggleChecked(checked: boolean, session: TestSession): void {
    if (!this.isChecked(session)) {
      this.checkSession(session);
    } else {
      this.uncheckSession(session);
    }
    this.onCheckedChanged();
  }

  toggleCheckAll(event: MatCheckboxChange): void {
    if (event.checked) {
      this.replaceCheckedSessions(
        this.sessions$.getValue()
          .filter(session => session.data.testId && session.data.testId > -1)
      );
    } else {
      this.replaceCheckedSessions([]);
    }
  }

  invertChecked(event: Event): boolean {
    event.preventDefault();
    const unChecked = this.sessions$.getValue()
      .filter(session => session.data.testId && session.data.testId > -1)
      .filter(session => !this.isChecked(session));
    this.replaceCheckedSessions(unChecked);
    return false;
  }

  countCheckedSessions(): number {
    return Object.values(this.checkedSessions).length;
  }

  isChecked(session: TestSession): boolean {
    return (typeof this.checkedSessions[session.id] !== 'undefined');
  }

  private checkSession(session: TestSession): void {
    this.checkedSessions[session.id] = session;
  }

  private uncheckSession(session: TestSession): void {
    if (this.isChecked(session)) {
      delete this.checkedSessions[session.id];
    }
  }

  private replaceCheckedSessions(sessionsToCheck: TestSession[]) {
    const newCheckedSessions = {};
    sessionsToCheck
      .forEach(session => { newCheckedSessions[session.id] = session; });
    this.checkedSessions = newCheckedSessions;
    this.onCheckedChanged();
  }

  private onCheckedChanged() {
    this.sessionCheckedGroupCount = Object.values(this.checkedSessions)
      .map(session => session.data.bookletName)
      .filter((value, index, self) => self.indexOf(value) === index)
      .length;
    const checkable = this.sessions$.getValue().filter(session => session.data.testId && session.data.testId > -1);
    this.allSessionsChecked = (checkable.length === this.countCheckedSessions());
    if (this.sessionCheckedGroupCount > 1) {
      this.selectedElement = null;
    }
  }

  isPauseAllowed(): boolean {
    const activeSessions = Object.values(this.checkedSessions).length && Object.values(this.checkedSessions)
      .filter(session => TestSessionService.hasState(session.data.testState, 'status', 'running'));
    return activeSessions.length && activeSessions
      .filter(session => TestSessionService.hasState(session.data.testState, 'status', 'running'))
      .filter(session => TestSessionService.hasState(session.data.testState, 'CONTROLLER', 'PAUSED'))
      .length === 0;
  }

  isResumeAllowed(): boolean {
    const activeSessions = Object.values(this.checkedSessions)
      .filter(session => TestSessionService.hasState(session.data.testState, 'status', 'running'));
    return activeSessions.length && activeSessions
      .filter(session => !TestSessionService.hasState(session.data.testState, 'CONTROLLER', 'PAUSED'))
      .length === 0;
  }

  isUnlockAllowed(): boolean {
    const lockedSessions = Object.values(this.checkedSessions)
      .filter(session => TestSessionService.hasState(session.data.testState, 'status', 'locked'));
    return lockedSessions.length && (lockedSessions.length === Object.values(this.checkedSessions).length);
  }

  ngAfterViewChecked(): void {
    this.isScrollable = this.mainElem.nativeElement.clientHeight < this.mainElem.nativeElement.scrollHeight;
  }

  scrollDown(): void {
    this.mainElem.nativeElement.scrollTo(0, this.mainElem.nativeElement.scrollHeight);
  }

  updateScrollHint(): void {
    const elem = this.mainElem.nativeElement;
    const reachedBottom = (elem.scrollTop + elem.clientHeight === elem.scrollHeight);
    elem.classList[reachedBottom ? 'add' : 'remove']('hide-scroll-hint');
  }

  finishEverythingCommand(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: 'auto',
      data: <ConfirmDialogData>{
        title: 'Testdurchführung Beenden',
        content: 'Achtung! Diese Aktion sperrt und beendet sämtliche Tests dieser Sitzung.',
        confirmbuttonlabel: 'Ja, ich möchte die Testdurchführung Beenden',
        showcancel: true
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.finishEverything();
      }
    });
  }

  private finishEverything(): void {
    this.isClosing = true;

    const getUnlockedConnectedTestIds = () => Object.values(this.sessions$.getValue())
      .filter(session => session.data.testId > 0 &&
        !TestSessionService.hasState(session.data.testState, 'status', 'locked') &&
        !TestSessionService.hasState(session.data.testState, 'CONTROLLER', 'TERMINATED') &&
        (TestSessionService.hasState(session.data.testState, 'CONNECTION', 'POLLING') ||
          TestSessionService.hasState(session.data.testState, 'CONNECTION', 'WEBSOCKET')))
      .map(session => session.data.testId);
    const getUnlockedTestIds = () => Object.values(this.sessions$.getValue())
      .filter(session => session.data.testId > 0)
      .filter(session => !TestSessionService.hasState(session.data.testState, 'status', 'locked'))
      .map(session => session.data.testId);

    this.bs.command('terminate', [], getUnlockedConnectedTestIds()) // kill running tests
      .add(() => {
        setTimeout(() => this.bs.lock(this.ownGroupName, getUnlockedTestIds()), 2000); // lock everything
      })
      .add(() => {
        setTimeout(() => { this.router.navigateByUrl('/r/login'); }, 5000); // go away
      });
  }
}
