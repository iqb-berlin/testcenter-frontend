import { TestBed, inject } from '@angular/core/testing';

import { MainDatastoreService } from './maindatastore.service';

describe('StatusService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MainDatastoreService]
    });
  });

  it('should be created', inject([MainDatastoreService], (service: MainDatastoreService) => {
    expect(service).toBeTruthy();
  }));
});
