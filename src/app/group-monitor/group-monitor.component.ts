import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {BackendService} from './backend.service';
import {BehaviorSubject, combineLatest, Observable, Subject, Subscription} from 'rxjs';
import {GroupData, TestSession, TestViewDisplayOptions} from './group-monitor.interfaces';
import {ActivatedRoute} from '@angular/router';
import {ConnectionStatus} from './websocket-backend.service';
import {map} from 'rxjs/operators';
import {Sort} from '@angular/material/sort';


type TestViewDisplayOptionKey = 'view';

@Component({
  selector: 'app-group-monitor',
  templateUrl: './group-monitor.component.html',
  styleUrls: ['./group-monitor.component.css']
})
export class GroupMonitorComponent implements OnInit, OnDestroy {

  private routingSubscription: Subscription = null;

  ownGroupName: string;
  ownGroup$: Observable<GroupData>;

  monitor$: Observable<TestSession[]>;
  connectionStatus$: Observable<ConnectionStatus>;
  sortBy$: Subject<Sort>;
  sessions$: Observable<TestSession[]>;

  displayOptions: TestViewDisplayOptions = {
    view: 'full'
  };

  constructor(
      private route: ActivatedRoute,
      private bs: BackendService,
  ) {}


  ngOnInit(): void {

    this.autoSelectViewMode();

    this.routingSubscription = this.route.params.subscribe(params => {

      this.ownGroupName = params['group-name']; // TODO fetch label
    });

    this.sortBy$ = new BehaviorSubject<Sort>({direction: 'asc', active: 'bookletName'});
    this.monitor$ = this.bs.subscribeSessionsMonitor();
    this.sessions$ = combineLatest<[Sort, TestSession[]]>([this.sortBy$, this.monitor$])
        .pipe(
            map((data: [Sort, TestSession[]]): TestSession[] => data[1].sort(
                (testSession1, testSession2) => {

                  if (data[0].active === "timestamp") {
                    return (testSession2.timestamp - testSession1.timestamp) * (data[0].direction === 'asc' ? 1 : -1);
                  }

                  const stringA = (testSession1[data[0].active] || "zzzzz");
                  const stringB = (testSession2[data[0].active] || "zzzzz");
                  return stringA.localeCompare(stringB) * (data[0].direction === 'asc' ? 1 : -1);
                }
            ))
        );



    this.connectionStatus$ = this.bs.connectionStatus$;

    this.ownGroup$ = this.bs.getGroupData(this.ownGroupName);
  }


  ngOnDestroy() {

    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
    this.bs.cutConnection();
  }


  @HostListener('window:resize', ['$event'])
  autoSelectViewMode(event?): void {

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


  sortSessions(sort: Sort): void {

    if (!sort.active || sort.direction === '') {
      return;
    }

    this.sortBy$.next(sort);
  }


  setDisplayOption(option: TestViewDisplayOptionKey, value: TestViewDisplayOptions[TestViewDisplayOptionKey]) {

    this.displayOptions[option] = value;
  }
}
