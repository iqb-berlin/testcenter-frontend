import {Component, OnDestroy, OnInit} from '@angular/core';
import {BackendService} from './backend.service';
import {Observable, Subscription} from 'rxjs';
import {TestSession} from './group-monitor.interfaces';
import {ActivatedRoute} from '@angular/router';
import {ConnectionStatus} from './websocket-backend.service';

@Component({
  selector: 'app-group-monitor',
  templateUrl: './group-monitor.component.html',
  styleUrls: ['./group-monitor.component.css']
})
export class GroupMonitorComponent implements OnInit, OnDestroy {

  private workspacesId: string;

  private routingSubscription: Subscription = null;

  sessions$: Observable<TestSession[]>;
  clientCount$: Observable<number>;
  connectionStatus$: Observable<ConnectionStatus>;

  constructor(
      private route: ActivatedRoute,
      private bs: BackendService,
  ) {}


  ngOnInit(): void {

    this.routingSubscription = this.route.params.subscribe(params => {

      this.workspacesId = params['ws'];
    });

    this.sessions$ = this.bs.subscribeSessionsMonitor();

    this.connectionStatus$ = this.bs.connectionStatus$;

    // this.connectionStatus$.subscribe(v => console.log("CONNECTION-STATUS: " + v));
  }


  ngOnDestroy() {

    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
    this.bs.cutConnection();
  }


  trackSession(index: number, session: TestSession): number {

    return session.personId * 10000 +  session.testId;
  }
}
