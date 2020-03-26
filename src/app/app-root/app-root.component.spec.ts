import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppRootComponent } from './app-root.component';
import {HttpClientModule} from "@angular/common/http";
import {ReactiveFormsModule} from "@angular/forms";
import {MatDialogModule} from "@angular/material/dialog";
import {AppRoutingModule} from "../app-routing.module";
import {IqbComponentsModule} from "iqb-components";
import {BackendService} from "../backend.service";

describe('AppRootComponent', () => {
  let component: AppRootComponent;
  let fixture: ComponentFixture<AppRootComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppRootComponent ],
      imports: [
        HttpClientModule,
        ReactiveFormsModule,
        MatDialogModule,
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
    fixture = TestBed.createComponent(AppRootComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
