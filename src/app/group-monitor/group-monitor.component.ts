import {Component, OnDestroy, OnInit} from '@angular/core';
import {BackendService} from './backend.service';
import {Observable, Subscription} from 'rxjs';
import {StatusUpdate} from './group-monitor.interfaces';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-group-monitor',
  templateUrl: './group-monitor.component.html',
  styleUrls: ['./group-monitor.component.css']
})
export class GroupMonitorComponent implements OnInit, OnDestroy {

  private workspacesId: string;

  private routingSubscription: Subscription = null;

  sessions$: Observable<StatusUpdate[]>;
  clientCount$: Observable<number>;
  serviceConnected$: Observable<boolean>;

  constructor(
      private route: ActivatedRoute,
      private bs: BackendService,
  ) {}


  ngOnInit(): void {

    this.routingSubscription = this.route.params.subscribe(params => {

      this.workspacesId = params['ws'];
    });

    console.log('going to connect');

    this.clientCount$ = this.bs.observe<number>('client.count');

    this.serviceConnected$ = this.bs.serviceConnected$;

    this.serviceConnected$.subscribe(s => {
      console.log('connection-status', s);
    });

    this.sessions$ = this.bs.observe<StatusUpdate[]>('status');

    // this.dataSource$.subscribe((status: StatusUpdate[]) => {
    //   status.forEach((statusUpate: StatusUpdate) => this.getBooklet(statusUpate));
    // });
  }


  ngOnDestroy() {

    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }


  trackSession(index: number, session: StatusUpdate) {

    return session.personId + '|' + session.testId;
  }
}
