import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Observable, of } from 'rxjs';
import { ResultsComponent } from './results.component';
import { BackendService } from '../backend.service';
import { WorkspaceDataService } from '../workspacedata.service';
import { ResultData } from '../workspace.interfaces';

class MockBackendService {
  // eslint-disable-next-line class-methods-use-this
  getResultData(): Observable<ResultData[]> {
    return of([{
      groupname: 'a_group',
      bookletsStarted: 5,
      num_units_min: 5,
      num_units_max: 10,
      num_units_mean: 7.5,
      lastchange: 100080050
    }]);
  }
}

describe('ResultsComponent', () => {
  let component: ResultsComponent;
  let fixture: ComponentFixture<ResultsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ResultsComponent],
      imports: [
        HttpClientModule,
        MatDialogModule,
        MatSnackBarModule,
        MatIconModule,
        MatTableModule,
        MatCheckboxModule
      ],
      providers: [
        {
          provide: BackendService,
          useValue: new MockBackendService()
        },
        WorkspaceDataService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
