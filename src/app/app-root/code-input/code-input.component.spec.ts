import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeInputComponent } from './code-input.component';
import {AppRoutingModule} from "../../app-routing.module";
import {HttpClientModule} from "@angular/common/http";
import {ReactiveFormsModule} from "@angular/forms";
import {IqbComponentsModule} from "iqb-components";
import {BackendService} from "../../backend.service";

describe('CodeInputComponent', () => {
  let component: CodeInputComponent;
  let fixture: ComponentFixture<CodeInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CodeInputComponent ],
      imports: [
        HttpClientModule,
        ReactiveFormsModule,
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
    fixture = TestBed.createComponent(CodeInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
