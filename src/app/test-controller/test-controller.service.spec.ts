import { TestBed, inject } from '@angular/core/testing';

import { TestControllerService } from './test-controller.service';

describe('TestControllerService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TestControllerService]
    });
  });

  it('should be created', inject([TestControllerService], (service: TestControllerService) => {
    expect(service).toBeTruthy();
  }));
});
