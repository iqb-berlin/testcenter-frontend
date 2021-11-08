import { TestBed } from '@angular/core/testing';
import { CustomtextService } from 'iqb-components';
import { Observable, of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import { TestLoaderService } from './test-loader.service';
import { TestBooklet, TestBookletXML, TestUnits } from './unit-test-example-data.spec';
import { LoadingFile, StateReportEntry, TestData, UnitData } from './test-controller.interfaces';

const MockBackendService = {
  getTestData: (): Observable<TestData> => of({
    xml: TestBookletXML,
    mode: 'run-hot-return',
    laststate: <StateReportEntry[]>[]
  }),

  getUnitData: (testId: string, unitid: string, unitalias: string):
  Observable<UnitData | boolean> => of(TestUnits[unitid] || false),

  getResource: (testId: string, resId: string, versionning = false):
  Observable<LoadingFile> => of({ content: 'blurb' })
};

const MockCustomtextService = {
};

let service: TestLoaderService;
let tcs: TestLoaderService;

describe('TestLoaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BackendService,
          useValue: MockBackendService
        },
        // {
        //   provide: TestControllerService,
        //   useValue: Test
        // },
        {
          provide: CustomtextService,
          useValue: MockCustomtextService
        }
      ],
      imports: [
        RouterTestingModule.withRoutes([])
      ]
    })
      .compileComponents();
    service = TestBed.inject(TestLoaderService);
    service.tcs = TestBed.inject(TestControllerService);
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

  fdescribe('loadTest', () => {
    it('should load the test and all it\'s files', () => {
      const testMayStartPromise = service.loadTest();
      // eslint-disable-next-line no-underscore-dangle
    });
  });
});
