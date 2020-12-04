import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SyscheckComponent } from './syscheck.component';
import { BackendService } from '../backend.service';
import { WorkspaceDataService } from '../workspacedata.service';

describe('Workspace-Admin: SyscheckComponent', () => {
  let component: SyscheckComponent;
  let fixture: ComponentFixture<SyscheckComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SyscheckComponent],
      imports: [
        HttpClientModule,
        MatDialogModule,
        MatSnackBarModule,
        MatIconModule,
        MatTableModule,
        MatCheckboxModule
      ],
      providers: [
        BackendService,
        WorkspaceDataService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SyscheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
