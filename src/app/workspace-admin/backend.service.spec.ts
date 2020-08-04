import { TestBed, inject } from '@angular/core/testing';

import { BackendService } from './backend.service';
import {HttpClientModule} from '@angular/common/http';
import {WorkspaceDataService} from './workspacedata.service';


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
