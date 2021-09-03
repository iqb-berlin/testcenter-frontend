import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TestControllerService } from '../test-controller.service';
import { MainDataService } from '../../maindata.service';
import { AppError } from '../../app.interfaces';

@Component({
  templateUrl: './test-status.component.html',
  styleUrls: ['./test-status.component.css']
})

export class TestStatusComponent implements OnInit, OnDestroy {
  loginName = '??';
  error: AppError;
  errorDetailsOpen = false;
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
          this.errorDetailsOpen = false;
          this.error = error;
          this.mds.setSpinnerOff(); // if error occurred while loading
        });
    });
  }

  ngOnDestroy(): void {
    this.appErrorSubscription.unsubscribe();
  }

  toggleErrorDetails(): void {
    this.errorDetailsOpen = !this.errorDetailsOpen;
  }

  terminateTest(): void {
    this.tcs.terminateTest('BOOKLETLOCKEDbyTESTEE', true);
  }
}
