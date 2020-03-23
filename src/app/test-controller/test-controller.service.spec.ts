import { TestBed, inject } from '@angular/core/testing';

import { TestControllerService } from './test-controller.service';
import {HttpClientModule} from "@angular/common/http";
import {BackendService} from "./backend.service";

describe('TestControllerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestControllerService,
        BackendService
      ],
      imports: [
        HttpClientModule
      ]
    });
  });

  it('should be created', inject([TestControllerService], (service: TestControllerService) => {
    expect(service).toBeTruthy();
  }));
});
