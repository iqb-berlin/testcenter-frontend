import {Component, OnInit} from '@angular/core';
import {TestControllerService} from "../test-controller.service";
import {UnitMenuButtonData} from "../test-controller.interfaces";
import {CustomtextService} from "iqb-components";

@Component({
  templateUrl: './unit-menu.component.html',
  styleUrls: ['./unit-menu.component.css']
})
export class UnitMenuComponent implements OnInit {
  unitMenuButtonList: UnitMenuButtonData[] = [];

  constructor(
    public cts: CustomtextService,
    public tcs: TestControllerService
  ) { }

  ngOnInit(): void {
    this.unitMenuButtonList = [];
    setTimeout(() => {
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

  goBack() {
    window.history.back();
  }
}
