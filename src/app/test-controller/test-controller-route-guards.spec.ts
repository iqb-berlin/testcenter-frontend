import { TestBed } from '@angular/core/testing';

import { TestControllerDeactivateGuard } from './test-controller-route-guards';
import {AppRoutingModule} from "../app-routing.module";
import {TestControllerService} from "./test-controller.service";
import {BackendService} from "./backend.service";
import {HttpClientModule} from "@angular/common/http";

describe('TestControllerDeactivateGuard', () => {
  let guard: TestControllerDeactivateGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TestControllerService, BackendService],
      imports: [HttpClientModule, AppRoutingModule]
    });
    guard = TestBed.inject(TestControllerDeactivateGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
