import { UnitDef, TestControllerService } from './../test-controller.service';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'tc-sidenavi-button',
  templateUrl: './tc-sidenavi-button.component.html',
  styleUrls: ['./tc-sidenavi-button.component.css']
})
export class TcSidenaviButtonComponent implements OnInit {
  @Input() unitData: UnitDef = null;
  isActive = false;
  constructor(
    private tcs: TestControllerService
  ) {
    this.tcs.currentUnitPos$.subscribe(up => {
      if (this.unitData !== null) {
        this.isActive = up === this.unitData.sequenceId;
      }
    });
  }

  ngOnInit() {
    if (this.unitData !== null) {
      this.isActive = this.tcs.currentUnitPos$.getValue() === this.unitData.sequenceId;
    }
  }

  sideNaviButtonClick() {
    if (this.unitData !== null) {
      this.tcs.goToUnitByPosition(this.unitData.sequenceId);
    }
  }
}
