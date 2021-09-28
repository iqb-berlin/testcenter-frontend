import { Component, OnInit } from '@angular/core';
import { TestControllerService } from '../test-controller.service';
import { UnitNaviButtonData } from '../test-controller.interfaces';
import { MainDataService } from '../../maindata.service';

@Component({
  templateUrl: './unit-menu.component.html',
  styleUrls: ['./unit-menu.component.css']
})
export class UnitMenuComponent implements OnInit {
  menu: Array<string|UnitNaviButtonData[]> = [];
  loginName = '??';

  constructor(
    public tcs: TestControllerService
  ) { }

  ngOnInit(): void {
    this.menu = [];
    setTimeout(() => {
      const authData = MainDataService.getAuthData();
      if (authData) {
        this.loginName = authData.displayName;
      }

      this.menu = [];
      let prevBlockLabel = '';
      let blockUnitList = [];

      for (let sequenceId = 0; sequenceId < this.tcs.unitListForNaviButtons.length; sequenceId++) {
        const blockLabel = this.tcs.unitListForNaviButtons[sequenceId].testletLabel || '';
        if (blockLabel !== prevBlockLabel) {
          this.menu.push(prevBlockLabel, blockUnitList);
          blockUnitList = [];
        }
        blockUnitList.push(this.tcs.unitListForNaviButtons[sequenceId]);
        prevBlockLabel = blockLabel;
      }
      this.menu.push(prevBlockLabel, blockUnitList);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  isArray(obj: unknown): boolean {
    return Array.isArray(obj);
  }

  terminateTest(): void {
    this.tcs.terminateTest('BOOKLETLOCKEDbyTESTEE', false);
  }
}
