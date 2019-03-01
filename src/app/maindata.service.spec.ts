import { TestBed, inject } from '@angular/core/testing';

import { MainDataService } from './maindata.service';

describe('MainDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MainDataService]
    });
  });

  it('should be created', inject([MainDataService], (service: MainDataService) => {
    expect(service).toBeTruthy();
  }));
});
