import { TestBed, inject } from '@angular/core/testing';

import { BackendService } from './backend.service';
import {HttpClientModule} from '@angular/common/http';


describe('HttpClient testing', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [BackendService]
    });
  });
  it('should be created', inject([BackendService], (service: BackendService) => {
    expect(service).toBeTruthy();
  }));
});
