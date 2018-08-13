import { TestBed, inject } from '@angular/core/testing';

import { TestdataService } from './testdata.service';

describe('TestdataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TestdataService]
    });
  });

  it('should be created', inject([TestdataService], (service: TestdataService) => {
    expect(service).toBeTruthy();
  }));
});
