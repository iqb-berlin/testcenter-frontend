import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonitorStarterComponent } from './monitor-starter.component';
import {AppRoutingModule} from "../../app-routing.module";
import {BackendService} from "../../test-controller/backend.service";
import {MainDataService} from "../../maindata.service";
import {HttpClientModule} from "@angular/common/http";

describe('MonitorStarterComponent', () => {
  let component: MonitorStarterComponent;
  let fixture: ComponentFixture<MonitorStarterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonitorStarterComponent ],
      imports: [AppRoutingModule, HttpClientModule],
      providers: [
        MainDataService,
        BackendService
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonitorStarterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
