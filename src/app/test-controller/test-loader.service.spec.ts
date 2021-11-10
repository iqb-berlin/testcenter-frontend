/* eslint-disable @typescript-eslint/dot-notation */
import { TestBed } from '@angular/core/testing';
import { CustomtextService } from 'iqb-components';
import { Observable, of, Subscription } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { takeWhile } from 'rxjs/operators';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import { TestLoaderService } from './test-loader.service';
import {
  TestBooklet,
  TestBookletConfig,
  TestBookletXML, TestBookletXmlVariants, TestPlayers, TestResources, TestTestState,
  TestUnitDefinitionsPerSequenceId, TestUnitPresentationProgressStates, TestUnitResponseProgressStates,
  TestUnits, TestUnitStateCurrentPages, TestUnitStateDataParts
} from './unit-test-example-data.spec';
import {
  LoadingFile, LoadingProgress, TestData, UnitData
} from './test-controller.interfaces';
import { Watcher, json, WatcherLogEntry } from './unit-test.util';

const MockBackendService = {
  getTestData: (testId: string): Observable<TestData> => {
    console.log('LOAD', testId);
    return of({
      xml: TestBookletXmlVariants[testId],
      mode: 'run-hot-return',
      laststate: TestTestState
    });
  },

  getUnitData: (testId: string, unitid: string): Observable<UnitData | boolean> => of(TestUnits[unitid] || false),

  getResource: (testId: string, resId: string): Observable<LoadingFile> => of(
    { progress: 0 },
    { progress: 50 },
    { progress: 75 },
    { progress: 100 },
    { content: TestResources[resId] }
  ),

  addTestLog(): Subscription {
    console.log(arguments[1].key, arguments[1].content); // TODO
    return of().subscribe();
  }
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
        RouterTestingModule.withRoutes(
          Object.keys(TestBookletXmlVariants)
            .map(key => ({ path: `t/${key}/u/1`, redirectTo: '' }))
        )
      ]
    })
      .compileComponents();
    service = TestBed.inject(TestLoaderService);
    service.tcs = TestBed.inject(TestControllerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('(getBookletFromXml)', () => {
    it('should read booklet content correctly', () => {
      const booklet = service['getBookletFromXml'](TestBookletXML);

      expect(json(booklet)).toEqual(json(TestBooklet));
    });
  });

  fdescribe('(loadTest)', () => {
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

    fdescribe('should load booklet, units, unit-contents and players in the right order ', () => {
      let watcher: Watcher;

      const loadTestWatched = async (testId: string) => {
        service.tcs.testId = testId;
        watcher = new Watcher();
        watcher.watchProperty('tls', service, 'totalLoadingProgress');
        watcher.watchObservable('tcs.testStatus$', service.tcs.testStatus$);
        watcher.watchMethod('tcs', service.tcs, 'setUnitLoadProgress$', (_, index) => (index === 0))
          .subscribe((args: [number, Observable<LoadingProgress>]) => {
            watcher.watchObservable(`tcs.unitContentLoadProgress$[${args[0]}]`, args[1]);
          });
        const everythingLoaded = watcher.watchProperty('tcs', service.tcs, 'loadProgressValue')
          .pipe(takeWhile(p => p < 100))
          .toPromise();
        watcher.watchMethod('tcs', service.tcs, 'addPlayer', (_, index) => (index === 0));
        const testStart = service.loadTest();
        return watcher.watchPromise('tls.loadTest', testStart);
        // await everythingLoaded;
      };

      it('when loading_mode is LAZY', async () => {
        await loadTestWatched('original');
        const expectedProtocol: WatcherLogEntry[] = [
          { name: 'tcs.testStatus$', value: 'INIT' },
          { name: 'tcs.loadProgressValue', value: 0 },
          // eslint-disable-next-line max-len,object-curly-newline
          { name: 'tls.totalLoadingProgress', value: { 'unit-1': 100, 'player-1': 100, 'content-1': 100, 'unit-2': 100, 'player-2': 100, 'content-2': 100, 'unit-3': 100, 'player-3': 100, 'content-3': 100, 'unit-4': 100, 'player-4': 100, 'content-4': 100, 'unit-5': 100, 'player-5': 100, 'content-5': 100 } },
          { name: 'tcs.testStatus$', value: 'LOADING' },

          // unit 1
          // 5 units, so each triplet of unit-player-content is worth 6.6% in the total progress
          // total progress gets updated first , dont' be confused
          { name: 'tcs.loadProgressValue', value: 6.666666666666667 }, // unit 1
          { name: 'tcs.setUnitLoadProgress$', value: [1] },
          { name: 'tcs.unitContentLoadProgress$[1]', value: { progress: 100 } },
          { name: 'tcs.loadProgressValue', value: 13.333333333333334 }, // unit 1 content (was embedded)
          { name: 'tcs.loadProgressValue', value: 13.333333333333334 }, // 0% of a-player
          { name: 'tcs.loadProgressValue', value: 16.666666666666664 }, // 50% of a-player
          { name: 'tcs.loadProgressValue', value: 18.333333333333332 }, // 75% of a-player
          { name: 'tcs.loadProgressValue', value: 20 }, // 100% of a-player
          { name: 'tcs.loadProgressValue', value: 20 }, // 100% of a-player (again)
          { name: 'tcs.addPlayer', value: ['a-player'] },

          // unit 2
          { name: 'tcs.loadProgressValue', value: 26.666666666666668 }, // unit 2
          { name: 'tcs.loadProgressValue', value: 26.666666666666668 }, // 0% of another player
          { name: 'tcs.loadProgressValue', value: 30 }, // 50% of another player
          { name: 'tcs.loadProgressValue', value: 31.666666666666664 }, // 75% of another-player
          { name: 'tcs.loadProgressValue', value: 33.33333333333333 }, // 100% of another-player
          { name: 'tcs.loadProgressValue', value: 33.33333333333333 }, // 100% of another-player (again)
          { name: 'tcs.addPlayer', value: ['another-player'] },

          // unit 3
          { name: 'tcs.loadProgressValue', value: 40 }, // unit 3
          { name: 'tcs.loadProgressValue', value: 40 }, // 0% of a-player-but-version-2
          { name: 'tcs.loadProgressValue', value: 43.333333333333336 }, // 50% of a-player-but-version-2
          { name: 'tcs.loadProgressValue', value: 45 }, // 75% of a-player-but-version-2
          { name: 'tcs.loadProgressValue', value: 46.666666666666664 }, // 100% of a-player-but-version-2
          { name: 'tcs.loadProgressValue', value: 46.666666666666664 }, // 100% of a-player-but-version-2 (again)
          { name: 'tcs.addPlayer', value: ['a-player-but-version-2'] },

          // unit 4
          { name: 'tcs.loadProgressValue', value: 53.333333333333336 }, // unit 4
          { name: 'tcs.setUnitLoadProgress$', value: [4] },
          { name: 'tcs.unitContentLoadProgress$[4]', value: { progress: 100 } },
          { name: 'tcs.loadProgressValue', value: 60 }, // unit 4 content (was embedded)
          { name: 'tcs.loadProgressValue', value: 66.66666666666666 }, // unit 4 player (already loaded)

          // unit 5
          { name: 'tcs.loadProgressValue', value: 73.33333333333333 }, // unit 5
          { name: 'tcs.setUnitLoadProgress$', value: [5] },
          { name: 'tcs.unitContentLoadProgress$[5]', value: { progress: 100 } },
          { name: 'tcs.loadProgressValue', value: 80 }, // unit 5 content (was embedded)
          { name: 'tcs.loadProgressValue', value: 86.66666666666667 }, // unit 5 player (already loaded)

          // external unit contents
          { name: 'tcs.setUnitLoadProgress$', value: [2] },
          { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 'PENDING' } },
          { name: 'tcs.setUnitLoadProgress$', value: [3] },
          { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 'PENDING' } },
          { name: 'tcs.loadProgressValue', value: 86.66666666666667 }, // 0% of unit 2 content
          { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 0 } },
          { name: 'tcs.loadProgressValue', value: 90 }, // 50% of unit 2 content
          { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 50 } },
          { name: 'tcs.loadProgressValue', value: 91.66666666666666 }, // 75% of unit 2 content
          { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 75 } },
          { name: 'tcs.loadProgressValue', value: 93.33333333333333 }, // 100% of unit 2 content
          { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 100 } },
          { name: 'tcs.loadProgressValue', value: 93.33333333333333 }, // 0% of unit 3 content
          { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 0 } },
          { name: 'tcs.loadProgressValue', value: 96.66666666666667 }, // 50% of unit 3 content
          { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 50 } },
          { name: 'tcs.loadProgressValue', value: 98.33333333333333 }, // 75% of unit 3 content
          { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 75 } },
          { name: 'tcs.loadProgressValue', value: 100 }, // 100% of unit 3 content
          { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 100 } },
          { name: 'tcs.loadProgressValue', value: 100 }, // 100% of everything

          // don't start until now because loadingMode is EAGER
          { name: 'tcs.testStatus$', value: 'RUNNING' },
          { name: 'tls.loadTest', value: undefined }
        ];
        watcher.eventLog.forEach(logEntry => {
          console.log(logEntry.name, logEntry.value);
        });
        expect(watcher.eventLog).toEqual(expectedProtocol);
      });

      xit('when loading_mode is EAGER', async () => {
        await loadTestWatched('widthLoadingModeEager');

        watcher.eventLog.forEach(logEntry => {
          console.log(logEntry.name, logEntry.value);
        });

        const expectedProtocol: WatcherLogEntry[] = [
          { name: 'tcs.testStatus$', value: 'INIT' },
          // eslint-disable-next-line max-len,object-curly-newline
          { name: 'tls.totalLoadingProgress', value: { 'unit-1': 100, 'player-1': 100, 'content-1': 100, 'unit-2': 100, 'player-2': 100, 'content-2': 100, 'unit-3': 100, 'player-3': 100, 'content-3': 100, 'unit-4': 100, 'player-4': 100, 'content-4': 100, 'unit-5': 100, 'player-5': 100, 'content-5': 100 } },
          { name: 'tcs.testStatus$', value: 'LOADING' },
          { name: 'tcs.setUnitLoadProgress$', value: [1] },
          { name: 'tcs.unitContentLoadProgress$[1]', value: { progress: 100 } },
          { name: 'tcs.addPlayer', value: ['a-player'] },
          // unit 2 is postponed, because it has external content
          { name: 'tcs.addPlayer', value: ['another-player'] },
          // unit 3  is postponed, because it has external content
          { name: 'tcs.addPlayer', value: ['a-player-but-version-2'] },
          { name: 'tcs.setUnitLoadProgress$', value: [4] },
          { name: 'tcs.unitContentLoadProgress$[4]', value: { progress: 100 } },
          { name: 'tcs.setUnitLoadProgress$', value: [5] },
          { name: 'tcs.unitContentLoadProgress$[5]', value: { progress: 100 } },
          { name: 'tcs.setUnitLoadProgress$', value: [2] },
          { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 'PENDING' } },
          { name: 'tcs.setUnitLoadProgress$', value: [3] },
          { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 'PENDING' } },
          { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 0 } },
          { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 50 } },
          { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 75 } },
          { name: 'tcs.unitContentLoadProgress$[2]', value: { progress: 100 } },
          { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 0 } },
          { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 50 } },
          { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 75 } },
          { name: 'tcs.unitContentLoadProgress$[3]', value: { progress: 100 } },
          // don't start until now because loadingMode is EAGER
          { name: 'tcs.testStatus$', value: 'RUNNING' },
          { name: 'tls.loadTest', value: undefined }
        ];

        expect(watcher.eventLog).toEqual(expectedProtocol);
      });
    });
  });
});
