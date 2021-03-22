/* eslint-disable class-methods-use-this */
// eslint-disable-next-line max-classes-per-file
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, of } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CustomtextPipe } from 'iqb-components';
import { Pipe } from '@angular/core';
import { GroupMonitorComponent } from './group-monitor.component';
import {
  Booklet,
  BookletError,
  GroupData, TestSession,
  TestSessionData
} from './group-monitor.interfaces';
import { exampleBooklet } from './booklet.service.spec';
import { BookletService } from './booklet.service';
import { BackendService } from './backend.service';
import { exampleSession } from './test-session.service.spec';
import { TestViewComponent } from './test-view/test-view.component';
import { TestSessionService } from './test-session.service';

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

class MockMatDialog {
  public open(): { afterClosed: () => Observable<{ action: boolean }> } {
    return {
      afterClosed: () => of({ action: true })
    };
  }
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
  transform(defaultValue: string, key: string, ...replacements: string[]): Observable<string> {
    return of<string>(defaultValue);
  }
}

export const exampleSessions: TestSession[] = [
  <TestSessionData>{
    personId: 1,
    personLabel: 'Person 1',
    groupName: 'group-1',
    groupLabel: 'Group 1',
    mode: 'run-hot-return',
    testId: 1,
    bookletName: 'example-booklet',
    testState: {
      CONTROLLER: 'RUNNING',
      status: 'running'
    },
    unitName: 'unit-5',
    unitState: {},
    timestamp: 10000500
  },
  <TestSessionData>{
    personId: 1,
    personLabel: 'Person 1',
    groupName: 'group-1',
    groupLabel: 'Group 1',
    mode: 'run-hot-return',
    testId: 2,
    bookletName: 'example-booklet-2',
    testState: {
      CONTROLLER: 'PAUSED',
      status: 'running'
    },
    unitName: 'unit-7',
    unitState: {},
    timestamp: 10000300
  },
  <TestSessionData>{
    personId: 2,
    personLabel: 'Person 2',
    groupName: 'group-1',
    groupLabel: 'Group 1',
    mode: 'run-hot-return',
    testId: -1,
    bookletName: null,
    testState: {
      status: 'pending'
    },
    unitName: null,
    unitState: {},
    timestamp: 10000000
  }
].map(session => TestSessionService.analyzeTestSession(session, exampleBooklet));

describe('GroupMonitorComponent', () => {
  let component: GroupMonitorComponent;
  let fixture: ComponentFixture<GroupMonitorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        GroupMonitorComponent,
        TestViewComponent,
        CustomtextPipe
      ],
      imports: [
        MatIconModule,
        MatTooltipModule,
        MatDialogModule,
        RouterTestingModule,
        MatMenuModule,
        MatSidenavModule,
        NoopAnimationsModule,
        MatRadioModule,
        MatCheckboxModule
      ],
      providers: [
        { provide: BookletService, useValue: new MockBookletService() },
        { provide: MatDialog, useValue: new MockMatDialog() },
        { provide: BackendService, useValue: new MockBackendService() }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupMonitorComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('sortSessions', () => {
    it('should sort by bookletName alphabetically', () => {
      const sorted = component.sortSessions({ active: 'bookletName', direction: 'asc' }, exampleSessions);
      expect(sorted.map(s => s.data.bookletName)).toEqual(['example-booklet', 'example-booklet-2', null]);
    });
    it('should sort by bookletName alphabetically in reverse', () => {
      const sorted = component.sortSessions({ active: 'bookletName', direction: 'desc' }, exampleSessions);
      expect(sorted.map(s => s.data.bookletName)).toEqual([null, 'example-booklet-2', 'example-booklet']);
    });
    it('should sort by personLabel alphabetically', () => {
      const sorted = component.sortSessions({ active: 'personLabel', direction: 'asc' }, exampleSessions);
      expect(sorted.map(s => s.data.personLabel)).toEqual(['Person 1', 'Person 1', 'Person 2']);
    });
    it('should sort by personLabel alphabetically in reverse', () => {
      const sorted = component.sortSessions({ active: 'personLabel', direction: 'desc' }, exampleSessions);
      expect(sorted.map(s => s.data.personLabel)).toEqual(['Person 2', 'Person 1', 'Person 1']);
    });
    it('should sort by timestamp', () => {
      const sorted = component.sortSessions({ active: 'timestamp', direction: 'asc' }, exampleSessions);
      expect(sorted.map(s => s.data.timestamp)).toEqual([10000000, 10000300, 10000500]);
    });
    it('should sort by timestamp reverse', () => {
      const sorted = component.sortSessions({ active: 'timestamp', direction: 'desc' }, exampleSessions);
      expect(sorted.map(s => s.data.timestamp)).toEqual([10000500, 10000300, 10000000]);
    });
    it('should sort by checked', () => {
      const exampleSession1 = exampleSessions[1];
      // sortSession does not only return sorted array, but sorts original array in-playe as js function sort does
      component.checkedSessions[exampleSession1.id] = exampleSession1;
      const sorted = component.sortSessions({ active: '_checked', direction: 'asc' }, exampleSessions);
      expect(sorted[0].id).toEqual(exampleSession1.id);
    });
    it('should sort by checked reverse', () => {
      const exampleSession1 = exampleSessions[1];
      component.checkedSessions[exampleSession1.id] = exampleSession1;
      const sorted = component.sortSessions({ active: '_checked', direction: 'desc' }, exampleSessions);
      expect(sorted[2].id).toEqual(exampleSession1.id);
    });
    it('should sort by superstate', () => {
      const sorted = component.sortSessions({ active: '_superState', direction: 'asc' }, exampleSessions);
      expect(sorted.map(s => s.state)).toEqual(['pending', 'paused', 'idle']);
    });
    it('should sort by superstate reverse', () => {
      const sorted = component.sortSessions({ active: '_superState', direction: 'desc' }, exampleSessions);
      expect(sorted.map(s => s.state)).toEqual(['idle', 'paused', 'pending']);
    });
    it('should sort by currentBlock', () => {
      const sorted = component.sortSessions({ active: '_currentBlock', direction: 'asc' }, exampleSessions);
      expect(sorted.map(s => (s.current ? s.current.parent.id : '--'))).toEqual(['ben', 'alf', '--']);
    });
    it('should sort by currentBlock reverse', () => {
      const sorted = component.sortSessions({ active: '_currentBlock', direction: 'desc' }, exampleSessions);
      expect(sorted.map(s => (s.current ? s.current.parent.id : '--'))).toEqual(['--', 'alf', 'ben']);
    });
    it('should sort by currentUnit label alphabetically', () => {
      const sorted = component.sortSessions({ active: '_currentUnit', direction: 'asc' }, exampleSessions);
      expect(sorted.map(s => (s.current ? s.current.unit.id : '--'))).toEqual(['unit-5', 'unit-7', '--']);
    });
    it('should sort by currentUnit label alphabetically reverse', () => {
      const sorted = component.sortSessions({ active: '_currentUnit', direction: 'desc' }, exampleSessions);
      expect(sorted.map(s => (s.current ? s.current.unit.id : '--'))).toEqual(['--', 'unit-7', 'unit-5']);
    });
  });
});
