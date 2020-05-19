import { Component, OnInit } from '@angular/core';
import {BackendService} from './backend.service';
import {Observable} from 'rxjs';
import {StatusUpdate} from './group-monitor.interfaces';

@Component({
  selector: 'app-group-monitor',
  templateUrl: './group-monitor.component.html',
  styleUrls: ['./group-monitor.component.css']
})
export class GroupMonitorComponent implements OnInit {

  constructor(private bs: BackendService) {

  }

  displayedColumns: string[] = ['status', 'name', 'personStatus', 'test', 'testStatus', 'unit', 'unitStatus'];

  dataSource$: Observable<any>;
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

  }

}
