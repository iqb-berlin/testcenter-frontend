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
  TestBookletXML, TestPlayers, TestResources,
  TestUnitDefinitionsPerSequenceId, TestUnitPresentationProgressStates, TestUnitResponseProgressStates,
  TestUnits, TestUnitStateCurrentPages, TestUnitStateDataParts
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getUnitData: (testId: string, unitid: string, unitalias: string):
  Observable<UnitData | boolean> => of(TestUnits[unitid] || false),

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getResource: (testId: string, resId: string, versionning = false):
  Observable<LoadingFile> => of(
    { progress: 0 },
    { progress: 50 },
    { progress: 75 },
    { progress: 100 },
    { content: TestResources[resId] }
  )
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

    it('should load the units, their definitions and their players', async () => {
      await service.loadTest();
      expect(service.tcs['unitDefinitions']).toEqual(TestUnitDefinitionsPerSequenceId);
      expect(service.tcs.bookletConfig).toEqual(TestBookletConfig);
      expect(service.tcs['players']).toEqual(TestPlayers);
    });

    it('should restore previous unit-states when loading test', async () => {
      await service.loadTest();
      expect(service.tcs['unitStateDataParts']).toEqual(TestUnitStateDataParts);
      expect(service.tcs['unitPresentationProgressStates']).toEqual(TestUnitPresentationProgressStates);
      expect(service.tcs['unitResponseProgressStates']).toEqual(TestUnitResponseProgressStates);
      expect(service.tcs['unitStateCurrentPages']).toEqual(TestUnitStateCurrentPages);
    });
  });
});
