import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SysCheckComponent } from './sys-check.component';
import {HttpClientModule} from "@angular/common/http";
import {BackendService} from "./backend.service";
import {AppRoutingModule} from "../app-routing.module";
import {MatDialogModule} from "@angular/material/dialog";

describe('SysCheck.SysCheckComponent', () => {
  let component: SysCheckComponent;
  let fixture: ComponentFixture<SysCheckComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SysCheckComponent
      ],
      imports: [
        HttpClientModule,
        AppRoutingModule,
        MatDialogModule
      ],
      providers: [
        BackendService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SysCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
