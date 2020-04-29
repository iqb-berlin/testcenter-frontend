import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestStatusComponent } from './test-status.component';
import {AppRoutingModule} from "../../app-routing.module";
import {HttpClientModule} from "@angular/common/http";

describe('TestStatusComponent', () => {
  let component: TestStatusComponent;
  let fixture: ComponentFixture<TestStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestStatusComponent ],
      imports: [HttpClientModule, AppRoutingModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
