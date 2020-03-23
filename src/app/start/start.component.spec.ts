import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { StartComponent } from './start.component';
import {HttpClientModule} from "@angular/common/http";
import {BackendService} from "../backend.service";
import {ReactiveFormsModule} from "@angular/forms";
import {MatDialogModule} from "@angular/material/dialog";
import {AppRoutingModule} from "../app-routing.module";
import {IqbComponentsModule} from "iqb-components";

describe('StartComponent', () => {
  let component: StartComponent;
  let fixture: ComponentFixture<StartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StartComponent ],
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
    fixture = TestBed.createComponent(StartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
