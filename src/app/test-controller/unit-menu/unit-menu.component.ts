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
      let blockUnitList: UnitNaviButtonData[] = [];
      const unitCount = this.tcs.rootTestlet.getMaxSequenceId() - 1;

      for (let sequenceId = 1; sequenceId <= unitCount; sequenceId++) {
        const unitData = this.tcs.rootTestlet.getUnitAt(sequenceId);
        const unitButtonData: UnitNaviButtonData = {
          sequenceId,
          shortLabel: unitData.unitDef.naviButtonLabel,
          longLabel: unitData.unitDef.title,
          testletLabel: unitData.testletLabel,
          disabled: unitData.unitDef.locked,
          isCurrent: sequenceId === this.tcs.currentUnitSequenceId
        };
        const blockLabel = unitData.testletLabel || '';
        if (blockLabel !== prevBlockLabel) {
          this.menu.push(prevBlockLabel, blockUnitList);
          blockUnitList = [];
        }
        blockUnitList.push(unitButtonData);
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
