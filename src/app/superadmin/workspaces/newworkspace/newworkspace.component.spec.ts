import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewworkspaceComponent } from './newworkspace.component';
import {ReactiveFormsModule} from "@angular/forms";
import {MatDialogModule} from "@angular/material/dialog";

describe('NewworkspaceComponent', () => {
  let component: NewworkspaceComponent;
  let fixture: ComponentFixture<NewworkspaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewworkspaceComponent ],
      imports: [ReactiveFormsModule, MatDialogModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewworkspaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
