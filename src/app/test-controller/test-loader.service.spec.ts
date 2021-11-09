/* eslint-disable @typescript-eslint/dot-notation */
import { TestBed } from '@angular/core/testing';
import { CustomtextService } from 'iqb-components';
import { Observable, of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import { TestLoaderService } from './test-loader.service';
import {
  TestBooklet,
  TestBookletConfig,
  TestBookletXML,
  TestUnitDefinitionsPerSequenceId,
  TestUnits
} from './unit-test-example-data.spec';
import {
  LoadingFile, StateReportEntry, TestData, UnitData
} from './test-controller.interfaces';
import { json } from './unit-test.util';

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
        {
          provide: CustomtextService,
          useValue: MockCustomtextService
        }
      ],
      imports: [
        RouterTestingModule.withRoutes([{ path: 't/u/1', redirectTo: '' }])
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
      const booklet = service['getBookletFromXml'](TestBookletXML);

      expect(json(booklet)).toEqual(json(TestBooklet));
    });
  });

  fdescribe('loadTest', () => {
    it('should load and parse the booklet', async () => {
      await service.loadTest();
      expect(json(service.tcs.rootTestlet)).toEqual(json(TestBooklet));
      expect(service.tcs.bookletConfig).toEqual(TestBookletConfig);
    });

    it('should load the units and their definitions', async () => {
      await service.loadTest();
      expect(service.tcs['unitDefinitions']).toEqual(TestUnitDefinitionsPerSequenceId);
      expect(service.tcs.bookletConfig).toEqual(TestBookletConfig);
    });
  });
});
