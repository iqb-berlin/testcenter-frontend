import { Component, OnInit } from '@angular/core';
import {BackendService} from './backend.service';
import {Observable, of} from 'rxjs';
import {StatusUpdate} from './group-monitor.interfaces';
import {Booklet, BookletService} from './booklet.service';

@Component({
  selector: 'app-group-monitor',
  templateUrl: './group-monitor.component.html',
  styleUrls: ['./group-monitor.component.css']
})
export class GroupMonitorComponent implements OnInit {

  constructor(
      private bs: BackendService,
      private bookletsService: BookletService,
  ) {}

  displayedColumns: string[] = ['status', 'name', 'personStatus', 'test', 'testStatus', 'unit', 'unitStatus', 'booklet'];

  dataSource$: Observable<StatusUpdate[]>;
  clientCount$: Observable<number>;
  serviceConnected$: Observable<boolean>;

  ngOnInit(): void {

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

  getBookletInfo(status: StatusUpdate): Observable<Booklet|boolean> {

    if ((typeof status.testState["status"] !== "undefined") && (status.testState["status"] === "locked")) {
      console.log('no need to load locked booklet', status.testId);
      return of(null);
    }

    return this.bookletsService.getBooklet(status.testId.toString());
  }
}
