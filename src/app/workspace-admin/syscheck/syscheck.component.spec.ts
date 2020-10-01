import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

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
        MatSnackBarModule
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
