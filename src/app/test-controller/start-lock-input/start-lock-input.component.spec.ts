import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StartLockInputComponent } from './start-lock-input.component';
import {ReactiveFormsModule} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from "@angular/material/dialog";

describe('StartLockInputComponent', () => {
  let component: StartLockInputComponent;
  let fixture: ComponentFixture<StartLockInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, MatDialogModule],
      declarations: [ StartLockInputComponent, MatDialogRef, MAT_DIALOG_DATA ]
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
