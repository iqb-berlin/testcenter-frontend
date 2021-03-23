/* eslint-disable class-methods-use-this */
// eslint-disable-next-line max-classes-per-file
import { async, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { Pipe } from '@angular/core';
import {
  Booklet,
  BookletError,
  GroupData,
  TestSessionData
} from './group-monitor.interfaces';
import { exampleBooklet } from './booklet.service.spec';
import { BookletService } from './booklet.service';
import { BackendService } from './backend.service';
import { exampleSession } from './test-session.service.spec';
import { GroupMonitorService } from './group-monitor.service';
import { unitTestExampleSessions } from './test-data.spec';

class MockBookletService {
  public booklets: Observable<Booklet>[] = [of(exampleBooklet)];

  public getBooklet = (bookletName: string): Observable<Booklet | BookletError> => {
    if (!bookletName) {
      return of({ error: 'general', species: null });
    }

    if (bookletName === 'test') {
      return of(exampleBooklet);
    }

    return of({ error: 'missing-file', species: null });
  };
}

class MockBackendService {
  observeSessionsMonitor(): Observable<TestSessionData[]> {
    return of([exampleSession.data]);
  }

  getGroupData(groupName: string): Observable<GroupData> {
    return of(<GroupData>{
      name: groupName,
      label: `Label of: ${groupName}`
    });
  }

  cutConnection(): void {}
}

@Pipe({ name: 'customtext' })
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class MockCustomtextPipe {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(defaultValue: string, ..._: string[]): Observable<string> {
    return of<string>(defaultValue);
  }
}

describe('GroupMonitorService', () => {
  let service: GroupMonitorService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [],
      providers: [
        GroupMonitorService,
        { provide: BookletService, useValue: new MockBookletService() },
        { provide: BackendService, useValue: new MockBackendService() }
      ]
    })
      .compileComponents();
    service = TestBed.inject(GroupMonitorService);
  }));

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('sortSessions', () => {
    it('should sort by bookletName alphabetically', () => {
      const sorted = service.sortSessions({ active: 'bookletName', direction: 'asc' }, unitTestExampleSessions);
      expect(sorted.map(s => s.data.bookletName))
        .toEqual(['example-booklet', 'example-booklet-2', 'example-booklet-3']);
    });

    it('should sort by bookletName alphabetically in reverse', () => {
      const sorted = service.sortSessions({ active: 'bookletName', direction: 'desc' }, unitTestExampleSessions);
      expect(sorted.map(s => s.data.bookletName))
        .toEqual(['example-booklet-3', 'example-booklet-2', 'example-booklet']);
    });

    it('should sort by personLabel alphabetically', () => {
      const sorted = service.sortSessions({ active: 'personLabel', direction: 'asc' }, unitTestExampleSessions);
      expect(sorted.map(s => s.data.personLabel)).toEqual(['Person 1', 'Person 1', 'Person 2']);
    });

    it('should sort by personLabel alphabetically in reverse', () => {
      const sorted = service.sortSessions({ active: 'personLabel', direction: 'desc' }, unitTestExampleSessions);
      expect(sorted.map(s => s.data.personLabel)).toEqual(['Person 2', 'Person 1', 'Person 1']);
    });

    it('should sort by timestamp', () => {
      const sorted = service.sortSessions({ active: 'timestamp', direction: 'asc' }, unitTestExampleSessions);
      expect(sorted.map(s => s.data.timestamp)).toEqual([10000000, 10000300, 10000500]);
    });

    it('should sort by timestamp reverse', () => {
      const sorted = service.sortSessions({ active: 'timestamp', direction: 'desc' }, unitTestExampleSessions);
      expect(sorted.map(s => s.data.timestamp)).toEqual([10000500, 10000300, 10000000]);
    });

    it('should sort by checked', () => {
      const exampleSession1 = unitTestExampleSessions[1];
      // sortSession does not only return sorted array, but sorts original array in-playe as js function sort does
      service.checkedSessions[exampleSession1.id] = exampleSession1;
      const sorted = service.sortSessions({ active: '_checked', direction: 'asc' }, unitTestExampleSessions);
      expect(sorted[0].id).toEqual(exampleSession1.id);
    });

    it('should sort by checked reverse', () => {
      const exampleSession1 = unitTestExampleSessions[1];
      service.checkedSessions[exampleSession1.id] = exampleSession1;
      const sorted = service.sortSessions({ active: '_checked', direction: 'desc' }, unitTestExampleSessions);
      expect(sorted[2].id).toEqual(exampleSession1.id);
    });

    it('should sort by superstate', () => {
      const sorted = service.sortSessions({ active: '_superState', direction: 'asc' }, unitTestExampleSessions);
      expect(sorted.map(s => s.state)).toEqual(['pending', 'paused', 'idle']);
    });

    it('should sort by superstate reverse', () => {
      const sorted = service.sortSessions({ active: '_superState', direction: 'desc' }, unitTestExampleSessions);
      expect(sorted.map(s => s.state)).toEqual(['idle', 'paused', 'pending']);
    });

    it('should sort by currentBlock', () => {
      const sorted = service.sortSessions({ active: '_currentBlock', direction: 'asc' }, unitTestExampleSessions);
      expect(sorted.map(s => (s.current ? s.current.parent.id : '--'))).toEqual(['ben', 'alf', '--']);
    });

    it('should sort by currentBlock reverse', () => {
      const sorted = service.sortSessions({ active: '_currentBlock', direction: 'desc' }, unitTestExampleSessions);
      expect(sorted.map(s => (s.current ? s.current.parent.id : '--'))).toEqual(['--', 'alf', 'ben']);
    });

    it('should sort by currentUnit label alphabetically', () => {
      const sorted = service.sortSessions({ active: '_currentUnit', direction: 'asc' }, unitTestExampleSessions);
      expect(sorted.map(s => (s.current ? s.current.unit.id : '--'))).toEqual(['unit-5', 'unit-7', '--']);
    });

    it('should sort by currentUnit label alphabetically reverse', () => {
      const sorted = service.sortSessions({ active: '_currentUnit', direction: 'desc' }, unitTestExampleSessions);
      expect(sorted.map(s => (s.current ? s.current.unit.id : '--'))).toEqual(['--', 'unit-7', 'unit-5']);
    });
  });
});
