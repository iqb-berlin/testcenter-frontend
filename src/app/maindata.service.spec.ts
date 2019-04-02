import { TestBed } from '@angular/core/testing';

import { MainDataService } from './maindata.service';

describe('MaindataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MainDataService = TestBed.get(MainDataService);
    expect(service).toBeTruthy();
  });
});
