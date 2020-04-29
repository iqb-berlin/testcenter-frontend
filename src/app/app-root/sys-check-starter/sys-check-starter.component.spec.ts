import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SysCheckStarterComponent } from './sys-check-starter.component';
import {HttpClientModule} from "@angular/common/http";
import {AppRoutingModule} from "../../app-routing.module";
import {IqbComponentsModule} from "iqb-components";
import {BackendService} from "../../backend.service";

describe('SysCheckStarterComponent', () => {
  let component: SysCheckStarterComponent;
  let fixture: ComponentFixture<SysCheckStarterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SysCheckStarterComponent ],
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
    fixture = TestBed.createComponent(SysCheckStarterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
