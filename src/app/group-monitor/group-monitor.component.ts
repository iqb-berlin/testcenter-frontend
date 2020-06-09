import {Component, OnDestroy, OnInit} from '@angular/core';
import {BackendService, ConnectionStatus} from './backend.service';
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
  connectionStatus$: Observable<ConnectionStatus>;

  constructor(
      private route: ActivatedRoute,
      private bs: BackendService,
  ) {}


  ngOnInit(): void {

    this.routingSubscription = this.route.params.subscribe(params => {

      this.workspacesId = params['ws'];
    });

    console.log('going to connect');

    this.sessions$ = this.bs.getSessions();
    // this.bs.connect('ZYX');
    // this.clientCount$ = this.bs.getChannel<number>('client.count');
    // this.sessions$ = this.bs.getChannel<StatusUpdate[]>('status');
    this.serviceConnected$ = this.bs.serviceConnected$;

    this.connectionStatus$ = this.bs.connectionStatus$;

    this.connectionStatus$.subscribe(v => console.log("CONNECTION-STATUS: " + v));

  }


  ngOnDestroy() {

    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }


  trackSession(index: number, session: StatusUpdate): number {

    return session.personId * 10000 +  session.testId;
  }
}
