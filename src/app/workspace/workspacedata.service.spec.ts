import { TestBed, inject } from '@angular/core/testing';

import { WorkspaceDataService } from './workspacedata.service';

describe('WorkspaceDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WorkspaceDataService]
    });
  });

  it('should be created', inject([WorkspaceDataService], (service: WorkspaceDataService) => {
    expect(service).toBeTruthy();
  }));
});
