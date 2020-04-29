import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestStarterComponent } from './test-starter.component';
import {HttpClientModule} from "@angular/common/http";
import {ReactiveFormsModule} from "@angular/forms";
import {AppRoutingModule} from "../../app-routing.module";
import {IqbComponentsModule} from "iqb-components";

describe('TestStarterComponent', () => {
  let component: TestStarterComponent;
  let fixture: ComponentFixture<TestStarterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestStarterComponent ],
      imports: [
        HttpClientModule,
        ReactiveFormsModule,
        AppRoutingModule,
        IqbComponentsModule
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestStarterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
