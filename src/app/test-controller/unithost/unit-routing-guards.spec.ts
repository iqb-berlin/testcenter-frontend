import { TestBed, inject } from '@angular/core/testing';

import { UnitActivateGuard, UnitDeactivateGuard } from './unit-routing-guards';
import {HttpClientModule} from "@angular/common/http";
import {MatDialogModule} from "@angular/material/dialog";
import {MatSnackBarModule} from "@angular/material/snack-bar";

describe('UnitActivateGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UnitActivateGuard],
      imports: [HttpClientModule, MatDialogModule, MatSnackBarModule]
    });
  });

  it('should ...', inject([UnitActivateGuard], (guard: UnitActivateGuard) => {
    expect(guard).toBeTruthy();
  }));
});


describe('UnitDeactivateGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UnitDeactivateGuard],
      imports: [HttpClientModule]
    });
  });

  it('should ...', inject([UnitDeactivateGuard], (guard: UnitDeactivateGuard) => {
    expect(guard).toBeTruthy();
  }));
});
