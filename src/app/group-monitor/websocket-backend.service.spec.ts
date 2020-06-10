import { TestBed } from '@angular/core/testing';

import { WebsocketBackendService } from './websocket-backend.service';

describe('WebsocketBackendService', () => {
  let service: WebsocketBackendService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebsocketBackendService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
