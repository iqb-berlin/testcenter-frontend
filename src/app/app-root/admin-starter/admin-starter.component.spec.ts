import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminStarterComponent } from './admin-starter.component';
import {AppRoutingModule} from "../../app-routing.module";
import {HttpClientModule} from "@angular/common/http";
import {IqbComponentsModule} from "iqb-components";
import {BackendService} from "../../backend.service";

describe('AdminStarterComponent', () => {
  let component: AdminStarterComponent;
  let fixture: ComponentFixture<AdminStarterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminStarterComponent ],
      imports: [
        HttpClientModule,
        AppRoutingModule,
        IqbComponentsModule
      ],
      providers: [
        BackendService
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminStarterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
