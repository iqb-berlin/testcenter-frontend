import {Component, OnInit} from '@angular/core';
import {TestControllerService} from '../test-controller.service';
import {CustomtextService} from 'iqb-components';
import {MainDataService} from '../../maindata.service';

@Component({
  templateUrl: './test-status.component.html',
  styleUrls: ['./test-status.component.css']
})

export class TestStatusComponent implements OnInit {
  loginName = '??';

  constructor(
    public tcs: TestControllerService,
    public cts: CustomtextService
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      const authData = MainDataService.getAuthData();
      if (authData) {
        this.loginName = authData.displayName;
      }
    });
  }

  terminateTest() {
    this.tcs.terminateTest('BOOKLETLOCKEDbyTESTEE');
  }
}
