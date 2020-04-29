import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StartLockInputComponent } from './start-lock-input.component';
import {ReactiveFormsModule} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {StartLockData} from "../test-controller.interfaces";
import {MatInputModule} from "@angular/material/input";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {NoopAnimationsModule} from "@angular/platform-browser/animations";

describe('StartLockInputComponent', () => {
  let component: StartLockInputComponent;
  let fixture: ComponentFixture<StartLockInputComponent>;

  beforeEach(async(() => {
    const matDialogRefStub = {};
    const matDialogDataStub = <StartLockData>{
      title: 'title',
      prompt: 'prompt',
      codes: [
        {
          testletId: 'testletA',
          prompt: 'promptA',
          code: 'codeA',
          value: 'valueA'
        },
        {
          testletId: 'testletB',
          prompt: 'promptB',
          code: 'codeB',
          value: 'valueB'
        }
      ]
    };
    TestBed.configureTestingModule({
      declarations: [ StartLockInputComponent ],
      imports: [
        MatDialogModule,
        ReactiveFormsModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        NoopAnimationsModule
      ],
      providers: [
        MatDialog,
        { provide: MatDialogRef, useValue: matDialogRefStub },
        { provide: MAT_DIALOG_DATA, useValue: matDialogDataStub }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StartLockInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
