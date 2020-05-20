import { Component, OnInit } from '@angular/core';
import {BackendService} from './backend.service';
import {Observable, Subscription} from 'rxjs';
import {StatusUpdate} from './group-monitor.interfaces';
import {Booklet, BookletService} from './booklet.service';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-group-monitor',
  templateUrl: './group-monitor.component.html',
  styleUrls: ['./group-monitor.component.css']
})
export class GroupMonitorComponent implements OnInit {

  private workspacesId: string;

  private routingSubscription: Subscription = null;

  dataSource$: Observable<StatusUpdate[]>;
  clientCount$: Observable<number>;
  serviceConnected$: Observable<boolean>;

  displayedColumns: string[] = ['status', 'name', 'personStatus', 'test', 'testStatus', 'unit', 'unitStatus', 'booklet'];


  constructor(
      private route: ActivatedRoute,
      private bs: BackendService,
      private bookletsService: BookletService,
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

    this.dataSource$ = this.bs.observe<StatusUpdate[]>('status');

    this.dataSource$.subscribe((status: StatusUpdate[]) => {
      status.forEach((statusUpate: StatusUpdate) => this.getBookletInfo(statusUpate));
    });
  }


  ngOnDestroy() {

    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }


  getBookletInfo(status: StatusUpdate): Booklet|boolean {

    // if ((typeof status.testState["status"] !== "undefined") && (status.testState["status"] === "locked")) {
    //   console.log('no need to load locked booklet', status.testId);
    //   return false;
    // }

    // return this.bookletsService.getBooklet(status.testId.toString()).getValue();
    return this.bookletsService.getBooklet(status.bookletName || "").getValue();
  }
}
