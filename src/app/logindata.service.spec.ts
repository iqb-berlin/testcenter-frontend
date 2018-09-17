import { TestBed, inject } from '@angular/core/testing';

import { LogindataService } from './logindata.service';

describe('LogindataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LogindataService]
    });
  });

  it('should be created', inject([LogindataService], (service: LogindataService) => {
    expect(service).toBeTruthy();
  }));
});
