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
import { GroupMonitorComponent } from './group-monitor.component';
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
import { TestViewComponent } from './test-view/test-view.component';

class MockBookletService {
  public booklets: Observable<Booklet>[] = [of(exampleBooklet)];

  public getBooklet = (bookletName: string): Observable<Booklet | BookletError> => {
    if (!bookletName) {
      return of({ error: 'general' });
    }

    if (bookletName === 'test') {
      return of(exampleBooklet);
    }

    return of({ error: 'missing-file' });
  };
}

class MockMatDialog {
  public open(): { afterClosed: () => Observable<{action: boolean}> } {
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

describe('GroupMonitorComponent', () => {
  let component: GroupMonitorComponent;
  let fixture: ComponentFixture<GroupMonitorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        GroupMonitorComponent,
        TestViewComponent
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
});
