/* eslint-disable class-methods-use-this */
// eslint-disable-next-line max-classes-per-file
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CustomtextPipe } from 'iqb-components';
import { Pipe } from '@angular/core';
import { GroupMonitorComponent } from './group-monitor.component';
import {
  GroupData, TestSession,
  TestSessionData, TestSessionSetStats
} from './group-monitor.interfaces';
import { BackendService } from './backend.service';
import { TestViewComponent } from './test-view/test-view.component';
import { GroupMonitorService } from './group-monitor.service';
import { unitTestSessionsStats, unitTestCheckedStats, unitTestExampleSessions } from './test-data.spec';

class MockMatDialog {
  open(): { afterClosed: () => Observable<{ action: boolean }> } {
    return {
      afterClosed: () => of({ action: true })
    };
  }
}

class MockBackendService {
  observeSessionsMonitor(): Observable<TestSessionData[]> {
    return of([unitTestExampleSessions[0].data]);
  }

  getGroupData(groupName: string): Observable<GroupData> {
    return of(<GroupData>{
      name: groupName,
      label: `Label of: ${groupName}`
    });
  }

  cutConnection(): void {}
}

class MockGroupMonitorService {
  sessionsStats$ = new BehaviorSubject<TestSessionSetStats>(unitTestSessionsStats);

  checkedStats$ = new BehaviorSubject<TestSessionSetStats>(unitTestCheckedStats);

  // checkedStats = unitTestCheckedStats;

  sessions$ = new BehaviorSubject<TestSession[]>(unitTestExampleSessions);

  sessions = unitTestExampleSessions;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  connect = (_: string) => {};
  disconnect = () => {};

  isChecked = () => false;
}

@Pipe({ name: 'customtext' })
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class MockCustomtextPipe {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(defaultValue: string, ..._: string[]): Observable<string> {
    return of<string>(defaultValue);
  }
}

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
        { provide: GroupMonitorService, useValue: new MockGroupMonitorService() },
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
});
