import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditworkspaceComponent } from './editworkspace.component';
import {ReactiveFormsModule} from "@angular/forms";
import {MatDialogModule} from "@angular/material/dialog";

describe('EditworkspaceComponent', () => {
  let component: EditworkspaceComponent;
  let fixture: ComponentFixture<EditworkspaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditworkspaceComponent ],
      imports: [ReactiveFormsModule, MatDialogModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditworkspaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
