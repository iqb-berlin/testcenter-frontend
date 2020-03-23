import { SaveReportComponent } from './save-report.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {ReactiveFormsModule} from "@angular/forms";
import {MatDialogModule} from "@angular/material/dialog";

describe('SaveReportComponent', () => {
  let component: SaveReportComponent;
  let fixture: ComponentFixture<SaveReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SaveReportComponent ],
      imports: [ReactiveFormsModule, MatDialogModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SaveReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
