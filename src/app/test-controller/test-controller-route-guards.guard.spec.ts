import { TestBed } from '@angular/core/testing';

import { TestControllerDeactivateGuard } from './test-controller-route-guards.guard';

describe('TestControllerDeactivateGuard', () => {
  let guard: TestControllerDeactivateGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(TestControllerDeactivateGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
