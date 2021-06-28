import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Observable, of } from 'rxjs';
import { IqbComponentsModule } from 'iqb-components';
import { FilesComponent } from './files.component';
import { BackendService } from '../backend.service';
import { WorkspaceDataService } from '../workspacedata.service';
import { MainDataService } from '../../maindata.service';
import { GetFileResponseData } from '../workspace.interfaces';
import { IqbFilesUploadQueueComponent } from './iqb-files-upload-queue/iqb-files-upload-queue.component';

class MockBackendService {
  // eslint-disable-next-line class-methods-use-this
  getFiles(): Observable<GetFileResponseData> {
    return of({
      Unit: [],
      Testtakers: [],
      SysCheck: [],
      Booklet: [],
      Resource: []
    });
  }
}

describe('FilesComponent', () => {
  let component: FilesComponent;
  let fixture: ComponentFixture<FilesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        FilesComponent,
        IqbFilesUploadQueueComponent
      ],
      imports: [
        HttpClientModule,
        MatExpansionModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTableModule,
        MatIconModule,
        MatCheckboxModule,
        IqbComponentsModule
      ],
      providers: [
        {
          provide: BackendService,
          useValue: new MockBackendService()
        },
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
