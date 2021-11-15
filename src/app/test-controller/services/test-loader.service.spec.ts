/* eslint-disable @typescript-eslint/dot-notation */
import { TestBed } from '@angular/core/testing';
import { CustomtextService } from 'iqb-components';
import { Observable, of, Subscription } from 'rxjs';
import { delay, takeWhile } from 'rxjs/operators';
import { NavigationExtras, Router } from '@angular/router';
import { TestControllerService } from './test-controller.service';
import { BackendService } from './backend.service';
import { TestLoaderService } from './test-loader.service';
import {
  loadingProtocols,
  TestBooklet,
  TestBookletConfig,
  TestBookletXmlVariants, TestPlayers, TestResources, TestTestState,
  TestUnitDefinitionsPerSequenceId, TestUnitPresentationProgressStates, TestUnitResponseProgressStates,
  TestUnits, TestUnitStateCurrentPages, TestUnitStateDataParts
} from '../unit-test-data/unit-test-example-data';
import {
  LoadingFile, LoadingProgress, TestData, UnitData
} from '../interfaces/test-controller.interfaces';
import { json } from '../unit-test-data/unit-test.util';
import { Watcher } from '../unit-test-data/watcher';

class MockBackendService {
  // eslint-disable-next-line class-methods-use-this
  getTestData(testId: keyof typeof TestBookletXmlVariants): Observable<TestData> {
    return of({
      xml: TestBookletXmlVariants[testId],
      mode: 'run-hot-return',
      laststate: TestTestState
    });
  }

  // eslint-disable-next-line class-methods-use-this
  getUnitData(testId: string, unitid: string): Observable<UnitData | boolean> {
    return of(TestUnits[unitid] || false);
  }

  // eslint-disable-next-line class-methods-use-this
  getResource(testId: string, resId: string): Observable<LoadingFile> {
    return of(
      { progress: 0 },
      { progress: 50 },
      { progress: 75 },
      { progress: 100 },
      { content: TestResources[resId] }
    )
      .pipe(
        delay(1)
      );
  }

  // eslint-disable-next-line class-methods-use-this
  addTestLog(): Subscription {
    return of().subscribe();
  }
}

const MockCustomtextService = {
};

const MockRouter = {
  log: <string[]>[],
  navigate(commands: string[], extras?: NavigationExtras): Promise<boolean> {
    this.log.push(...commands);
    return Promise.resolve(true);
  }
};

let service: TestLoaderService;

describe('TestLoaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestLoaderService,
        TestControllerService,
        {
          provide: BackendService,
          useValue: new MockBackendService()
        },
        {
          provide: CustomtextService,
          useValue: MockCustomtextService
        },
        {
          provide: Router,
          useValue: MockRouter
        }
      ]
    });
    service = TestBed.inject(TestLoaderService);
    service.tcs = TestBed.inject(TestControllerService);
    service.tcs.testId = 'withLoadingModeEager';
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('(loadTest)', () => {
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

    describe('should load booklet, units, unit-contents and players in the right order and track progress', () => {
      let watcher: Watcher;
      const loadTestWatched = async (testId: keyof typeof TestBookletXmlVariants) => {
        service.tcs.testId = testId;
        watcher = new Watcher();
        // watcher.log$.subscribe(console.log);
        watcher.watchObservable('tcs.testStatus$', service.tcs.testStatus$);
        watcher.watchMethod('tcs', service.tcs, 'setUnitLoadProgress$', { 1: null })
          .subscribe((args: [number, Observable<LoadingProgress>]) => {
            watcher.watchObservable(`tcs.unitContentLoadProgress$[${args[0]}]`, args[1]);
          });
        const everythingLoaded = watcher.watchProperty('tcs', service.tcs, 'totalLoadingProgress')
          .pipe(takeWhile(p => p < 100))
          .toPromise();
        watcher.watchMethod('tcs', service.tcs, 'addPlayer', { 1: null });
        watcher.watchMethod('bs', service['bs'], 'addTestLog', { 0: null, 1: testLogEntries => testLogEntries[0].key });
        const testStart = watcher.watchPromise('tls.loadTest', service.loadTest());
        return Promise.all([testStart, everythingLoaded]);
      };

      it('when loading_mode is LAZY', async () => {
        await loadTestWatched('withLoadingModeLazy');
        expect(watcher.log).toEqual(loadingProtocols.withLoadingModeLazy);
      });

      it('when loading_mode is EAGER', async () => {
        await loadTestWatched('withLoadingModeEager');
        expect(watcher.log).toEqual(loadingProtocols.withLoadingModeEager);
      });
    });
  });
});
