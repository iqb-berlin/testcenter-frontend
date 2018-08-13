import { TestBed, async, inject } from '@angular/core/testing';

import { UnitActivateGuard, UnitDeactivateGuard } from './unit-routing';

describe('UnitActivateGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UnitActivateGuard]
    });
  });

  it('should ...', inject([UnitActivateGuard], (guard: UnitActivateGuard) => {
    expect(guard).toBeTruthy();
  }));
});


describe('UnitDeactivateGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UnitDeactivateGuard]
    });
  });

  it('should ...', inject([UnitDeactivateGuard], (guard: UnitDeactivateGuard) => {
    expect(guard).toBeTruthy();
  }));
});
