import { ServerError } from '../backend.service';
import { MainDataService } from '../maindata.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-errormsg',
  templateUrl: './errormsg.component.html',
  styleUrls: ['./errormsg.component.css']
})
export class ErrormsgComponent implements OnInit, OnDestroy {
  private errorMsg: ServerError = null;
  private globalErrorMsgSubscription: Subscription = null;

  constructor(
    private mds: MainDataService
  ) { }

  ngOnInit() {
    this.globalErrorMsgSubscription = this.mds.globalErrorMsg$.subscribe(m => this.errorMsg = m);
  }

  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  ngOnDestroy() {
    if (this.globalErrorMsgSubscription !== null) {
      this.globalErrorMsgSubscription.unsubscribe();
    }
  }
}
