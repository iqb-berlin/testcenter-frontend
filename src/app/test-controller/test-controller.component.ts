import { LogindataService } from './../logindata.service';
import { TestControllerService, UnitDef } from './test-controller.service';
import { Component } from '@angular/core';

@Component({
  templateUrl: './test-controller.component.html',
  styleUrls: ['./test-controller.component.css']
})
export class TestControllerComponent {
  private showUnitComponent = true;
  private allUnits: UnitDef[] = [];
  private errorMsg = '';

  constructor (
    private tcs: TestControllerService,
    private lds: LogindataService
  ) {
    this.tcs.allUnits$.subscribe(uList => this.allUnits = uList);
    this.lds.globalErrorMsg$.subscribe(m => this.errorMsg = m);
  }
}
