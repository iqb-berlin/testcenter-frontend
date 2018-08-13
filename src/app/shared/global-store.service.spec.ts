import { TestBed, inject } from '@angular/core/testing';

import { GlobalStoreService } from './global-store.service';

describe('GlobalStoreService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GlobalStoreService]
    });
  });

  it('should be created', inject([GlobalStoreService], (service: GlobalStoreService) => {
    expect(service).toBeTruthy();
  }));
});
