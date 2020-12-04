import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { FilesComponent } from './files.component';
import { BackendService } from '../backend.service';
import { WorkspaceDataService } from '../workspacedata.service';
import { MainDataService } from '../../maindata.service';
import { IqbFilesUploadQueueComponent } from './iqb-files';

describe('FilesComponent', () => {
  let component: FilesComponent;
  let fixture: ComponentFixture<FilesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        FilesComponent,
        IqbFilesUploadQueueComponent
      ],
      imports: [
        HttpClientModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTableModule,
        MatIconModule,
        MatCheckboxModule
      ],
      providers: [
        BackendService,
        WorkspaceDataService,
        MainDataService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
