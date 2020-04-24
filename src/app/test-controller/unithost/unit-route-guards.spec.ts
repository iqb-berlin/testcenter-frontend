import { TestBed, inject } from '@angular/core/testing';

import { UnitActivateGuard, UnitDeactivateGuard } from './unit-route-guards';
import {HttpClientModule} from "@angular/common/http";
import {MatDialogModule} from "@angular/material/dialog";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {MainDataService} from "../../maindata.service";
import {BackendService} from "../backend.service";
import {CustomtextService} from "iqb-components";
import {TestControllerService} from "../test-controller.service";
import {AppRoutingModule} from "../../app-routing.module";

describe('UnitActivateGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UnitActivateGuard, MainDataService, TestControllerService, BackendService, CustomtextService],
      imports: [HttpClientModule, AppRoutingModule, MatDialogModule, MatSnackBarModule]
    });
  });

  it('should ...', inject([UnitActivateGuard], (guard: UnitActivateGuard) => {
    expect(guard).toBeTruthy();
  }));
});


describe('UnitDeactivateGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UnitDeactivateGuard, TestControllerService],
      imports: [HttpClientModule, AppRoutingModule]
    });
  });

  it('should ...', inject([UnitDeactivateGuard], (guard: UnitDeactivateGuard) => {
    expect(guard).toBeTruthy();
  }));
});
