import { TestBed, inject } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { WorkspaceDataService } from './workspacedata.service';

describe('WorkspaceDataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [WorkspaceDataService]
    });
  });

  it('should be created', inject([WorkspaceDataService], (service: WorkspaceDataService) => {
    expect(service).toBeTruthy();
  }));
});
