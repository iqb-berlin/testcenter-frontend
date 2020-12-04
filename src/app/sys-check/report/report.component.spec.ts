import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { BackendService } from '../backend.service';
import { ReportComponent } from './report.component';

describe('ReportComponent', () => {
  let component: ReportComponent;
  let fixture: ComponentFixture<ReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ReportComponent],
      imports: [
        HttpClientModule,
        MatDialogModule,
        MatSnackBarModule,
        MatCardModule,
        RouterModule.forRoot([])
      ],
      providers: [
        BackendService,
        {
          provide: APP_BASE_HREF,
          useValue: 'http://nothing/'
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
