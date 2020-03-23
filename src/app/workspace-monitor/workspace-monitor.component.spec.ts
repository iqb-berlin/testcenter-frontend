import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceMonitorComponent } from './workspace-monitor.component';
import {HttpClientModule} from "@angular/common/http";
import {BackendService} from "./backend.service";
import {AppRoutingModule} from "../app-routing.module";
import {MatSnackBarModule} from "@angular/material/snack-bar";

describe('WorkspaceMonitorComponent', () => {
  let component: WorkspaceMonitorComponent;
  let fixture: ComponentFixture<WorkspaceMonitorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkspaceMonitorComponent ],
      imports: [
        HttpClientModule,
        AppRoutingModule,
        MatSnackBarModule
      ],
      providers: [
        BackendService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspaceMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
