import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestControllerComponent } from './test-controller.component';
import {HttpClientModule} from "@angular/common/http";
import {BackendService} from "./backend.service";
import {MatDialogModule} from "@angular/material/dialog";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {AppRoutingModule} from "../app-routing.module";

describe('TestControllerComponent', () => {
  let component: TestControllerComponent;
  let fixture: ComponentFixture<TestControllerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestControllerComponent ],
      imports: [
        HttpClientModule,
        MatDialogModule,
        MatSnackBarModule,
        AppRoutingModule
      ],
      providers: [
        BackendService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestControllerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
