import { TestBed, inject } from '@angular/core/testing';

import { SyscheckDataService } from './syscheck-data.service';

describe('SyscheckDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SyscheckDataService]
    });
  });

  it('should be created', inject([SyscheckDataService], (service: SyscheckDataService) => {
    expect(service).toBeTruthy();
  }));
});
