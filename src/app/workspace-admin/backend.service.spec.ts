import { TestBed, inject } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';

import { BackendService } from './backend.service';
import { WorkspaceDataService } from './workspacedata.service';

describe('HttpClient testing', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [
        BackendService,
        WorkspaceDataService]
    });
  });
  it('should be created', inject([BackendService], (service: BackendService) => {
    expect(service).toBeTruthy();
  }));
});
