import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {BackendService} from './backend.service';
import {BehaviorSubject, combineLatest, Observable, Subject, Subscription} from 'rxjs';
import {GroupData, TestSession, TestViewDisplayOptions, TestViewDisplayOptionKey} from './group-monitor.interfaces';
import {ActivatedRoute} from '@angular/router';
import {ConnectionStatus} from './websocket-backend.service';
import {map} from 'rxjs/operators';
import {Sort} from '@angular/material/sort';


@Component({
  selector: 'app-group-monitor',
  templateUrl: './group-monitor.component.html',
  styleUrls: ['./group-monitor.component.css']
})
export class GroupMonitorComponent implements OnInit, OnDestroy {

  private routingSubscription: Subscription = null;

  ownGroup$: Observable<GroupData>;

  monitor$: Observable<TestSession[]>;
  connectionStatus$: Observable<ConnectionStatus>;
  sortBy$: Subject<Sort>;
  sessions$: Observable<TestSession[]>;

  displayOptions: TestViewDisplayOptions = {
    view: 'full',
    groupColumn: 'hide'
  };

  constructor(
      private route: ActivatedRoute,
      private bs: BackendService,
  ) {}


  ngOnInit(): void {

    this.autoSelectViewMode();

    this.routingSubscription = this.route.params.subscribe(params => {

      this.ownGroup$ = this.bs.getGroupData(params['group-name']);
    });

    this.sortBy$ = new BehaviorSubject<Sort>({direction: 'asc', active: 'bookletName'});

    this.monitor$ = this.bs.subscribeSessionsMonitor();

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
  autoSelectViewMode(): void {

    const screenWidth = window.innerWidth;
    if (screenWidth > 1200) {
      this.displayOptions.view = 'full';
    } else if (screenWidth > 800) {
      this.displayOptions.view = 'medium';
    } else {
      this.displayOptions.view = 'small';
    }
  }


  trackSession(index: number, session: TestSession): number {

    return session.personId * 10000 +  session.testId;
  }


  sortSessions(sort: Sort, sessions: TestSession[]): TestSession[] {

    return sessions.sort(

      (testSession1, testSession2) => {

        if (sort.active === "timestamp") {
          return (testSession2.timestamp - testSession1.timestamp) * (sort.direction === 'asc' ? 1 : -1);
        }

        const stringA = (testSession1[sort.active] || "zzzzz");
        const stringB = (testSession2[sort.active] || "zzzzz");
        return stringA.localeCompare(stringB) * (sort.direction === 'asc' ? 1 : -1);
      }
    )
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
}
