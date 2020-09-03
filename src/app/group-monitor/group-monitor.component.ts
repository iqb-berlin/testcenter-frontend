import {Component, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BackendService} from './backend.service';
import {BehaviorSubject, combineLatest, Observable, Subject, Subscription} from 'rxjs';
import {
  GroupData,
  TestSession,
  TestViewDisplayOptions,
  TestViewDisplayOptionKey, Testlet, Unit,
} from './group-monitor.interfaces';
import {ActivatedRoute} from '@angular/router';
import {ConnectionStatus} from '../shared/websocket-backend.service';
import {map} from 'rxjs/operators';
import {Sort} from '@angular/material/sort';
import {MatSidenav} from '@angular/material/sidenav';


@Component({
  selector: 'app-group-monitor',
  templateUrl: './group-monitor.component.html',
  styleUrls: ['./group-monitor.component.css']
})
export class GroupMonitorComponent implements OnInit, OnDestroy {

  constructor(
      private route: ActivatedRoute,
      private bs: BackendService,
  ) {}
  private routingSubscription: Subscription = null;

  ownGroup$: Observable<GroupData>;

  monitor$: Observable<TestSession[]>;
  connectionStatus$: Observable<ConnectionStatus>;
  sortBy$: Subject<Sort>;
  sessions$: Observable<TestSession[]>;

  displayOptions: TestViewDisplayOptions = {
    view: 'full',
    groupColumn: 'hide',
    selectionMode: 'block',
    testSelectionMode: 'single'
  };

  selectedElement: Testlet|Unit|null = null;
  markedElement: Testlet|Unit|null = null;

  private bookletIdsViewIsAdjustedFor: string[] = [];
  private lastWindowSize = Infinity;

  @ViewChild('sidenav', {static: true}) sidenav: MatSidenav;

  ngOnInit(): void {
    this.routingSubscription = this.route.params.subscribe(params => {
      this.ownGroup$ = this.bs.getGroupData(params['group-name']);
    });

    this.sortBy$ = new BehaviorSubject<Sort>({direction: 'asc', active: 'bookletName'});

    this.monitor$ = this.bs.observeSessionsMonitor();

    this.sessions$ = combineLatest<[Sort, TestSession[]]>([this.sortBy$, this.monitor$])
        .pipe(map(data => this.sortSessions(...data)));

    this.connectionStatus$ = this.bs.connectionStatus$;
  }

  ngOnDestroy() {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
    this.bs.cutConnection();
  }

  @HostListener('window:resize', ['$event'])
  adjustViewModeOnWindowResize(): void {
    if (this.lastWindowSize > window.innerWidth) {
      this.shrinkViewIfNecessary();
    } else {
      this.growViewIfPossible();
    }
    this.lastWindowSize = window.innerWidth;
  }

  adjustViewModeOnBookletLoad(bookletId: string): void {
    if (bookletId && this.bookletIdsViewIsAdjustedFor.indexOf(bookletId) === -1) {
      this.bookletIdsViewIsAdjustedFor.push(bookletId);
      this.growViewIfPossible();
    }
  }

  private growViewIfPossible() {
    if (this.getOverflow() <= 0) {
      this.displayOptions.view = 'full';
      setTimeout(() => this.shrinkViewIfNecessary(), 15);
    }
  }

  private shrinkViewIfNecessary(): void {
    if (this.getOverflow() > 0) {
      if (this.displayOptions.view === 'full') {
        this.displayOptions.view = 'medium';
        setTimeout(() => this.shrinkViewIfNecessary(), 15);
      } else if (this.displayOptions.view === 'medium') {
        this.displayOptions.view = 'small';
      }
    }
  }

  private getOverflow = (): number => {
    const backgroundElement = document.querySelector('.adminbackground');
    const testViewTableElement = document.querySelector('.test-view-table');
    return testViewTableElement.scrollWidth - (backgroundElement.clientWidth - 50); // 50 = adminbackground's padding *2
  }

  trackSession(index: number, session: TestSession): number {
    return session.personId * 10000 +  session.testId;
  }

  sortSessions(sort: Sort, sessions: TestSession[]): TestSession[] {
    return sessions
        .sort((testSession1, testSession2) => {
          if (sort.active === 'timestamp') {
            return (testSession2.timestamp - testSession1.timestamp) * (sort.direction === 'asc' ? 1 : -1);
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

  selectElement(testletOrUnit: Testlet|Unit|null) {
    this.selectedElement = testletOrUnit;
    this.sidenav.toggle(testletOrUnit != null);
  }

  markElement(testletOrUnit: Testlet|Unit|null) {
    this.markedElement = testletOrUnit;
  }
}
