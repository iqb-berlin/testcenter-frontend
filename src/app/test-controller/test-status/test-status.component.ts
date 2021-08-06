import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TestControllerService } from '../test-controller.service';
import { MainDataService } from '../../maindata.service';

@Component({
  templateUrl: './test-status.component.html',
  styleUrls: ['./test-status.component.css']
})

export class TestStatusComponent implements OnInit, OnDestroy {
  loginName = '??';
  errorLabel = '';
  private appErrorSubscription: Subscription;

  constructor(
    public tcs: TestControllerService,
    public mds: MainDataService
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      const authData = MainDataService.getAuthData();
      if (authData) {
        this.loginName = authData.displayName;
      }
      this.appErrorSubscription = this.mds.appError$
        .subscribe(error => {
          this.errorLabel = error.label;
        });
    });
  }

  ngOnDestroy(): void {
    this.appErrorSubscription.unsubscribe();
  }

  terminateTest(): void {
    this.tcs.terminateTest('BOOKLETLOCKEDbyTESTEE', true);
  }
}
