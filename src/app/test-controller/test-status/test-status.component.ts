import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {TestControllerService} from '../test-controller.service';
import {CustomtextService} from 'iqb-components';
import {UnitMenuButtonData} from '../test-controller.interfaces';
import {MainDataService} from '../../maindata.service';

@Component({
  templateUrl: './test-status.component.html',
  styleUrls: ['./test-status.component.css']
})

export class TestStatusComponent implements OnInit, OnDestroy {
  unitMenuButtonList: UnitMenuButtonData[] = [];
  private routingSubscription: Subscription = null;
  private unitMenuButtonListSubscription: Subscription = null;
  flag = '';
  loginName = '??';

  constructor(
    public tcs: TestControllerService,
    public cts: CustomtextService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      const authData = MainDataService.getAuthData();
      if (authData) {
        this.loginName = authData.displayName;
      }
      this.routingSubscription = this.route.params.subscribe(params => {
        this.flag = params['f'];
      });
      this.unitMenuButtonList = [];
      let testletMarkerSwitch = true;
      let prevTestletLabel = '';
      if (this.tcs.bookletConfig.unit_menu !== 'OFF' || this.tcs.testMode.showUnitMenu) {
        for (let unitIndex = 0; unitIndex < this.tcs.unitListForNaviButtons.length; unitIndex++) {
          if (this.tcs.unitListForNaviButtons[unitIndex].longLabel.trim()
              && (!this.tcs.unitListForNaviButtons[unitIndex].disabled || this.tcs.bookletConfig.unit_menu === 'FULL')) {
            const testletLabel = this.tcs.unitListForNaviButtons[unitIndex].testletLabel;
            let testletMarker = 'testlet-marker-non';
            if (testletLabel) {
              if (testletLabel !== prevTestletLabel) {
                testletMarkerSwitch = !testletMarkerSwitch;
                prevTestletLabel = testletLabel;
              }
              testletMarker = testletMarkerSwitch ? 'testlet-marker-a' : 'testlet-marker-b';
            }
            this.unitMenuButtonList.push({
              sequenceId: this.tcs.unitListForNaviButtons[unitIndex].sequenceId,
              label: this.tcs.unitListForNaviButtons[unitIndex].longLabel,
              isCurrent: this.tcs.unitListForNaviButtons[unitIndex].isCurrent,
              isDisabled: this.tcs.unitListForNaviButtons[unitIndex].disabled,
              testletLabel: testletLabel,
              testletMarker: testletMarker
            });
          }
        }
      }
    });
  }

  terminateTest() {
    this.tcs.terminateTest('BOOKLETLOCKEDbyTESTEE');
  }

  ngOnDestroy() {
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
    if (this.unitMenuButtonListSubscription !== null) {
      this.unitMenuButtonListSubscription.unsubscribe();
    }
  }
}
