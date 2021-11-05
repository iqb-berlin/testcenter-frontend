import { TestBed } from '@angular/core/testing';
import { CustomtextService } from 'iqb-components';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import { TestLoaderService } from './test-loader.service';
import { TestBooklet, TestBookletXML } from './unit-test-example-data.spec';

const MockBackendService = {
};

const MockTestControllerService = {
};

const MockCustomtextService = {
};

let service: TestLoaderService;

describe('TestLoaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BackendService,
          useValue: MockBackendService
        },
        {
          provide: TestControllerService,
          useValue: MockTestControllerService
        },
        {
          provide: CustomtextService,
          useValue: MockCustomtextService
        }
      ],
      imports: [

      ]
    })
      .compileComponents();
    service = TestBed.inject(TestLoaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getBookletFromXml', () => {
    it('should read booklet content correctly', () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const booklet = service['getBookletFromXml'](TestBookletXML);
      const bookletJSON = JSON.parse(JSON.stringify(booklet));
      const testBookletJSON = JSON.parse(JSON.stringify(TestBooklet));
      expect(bookletJSON).toEqual(testBookletJSON);
    });
  });
});
