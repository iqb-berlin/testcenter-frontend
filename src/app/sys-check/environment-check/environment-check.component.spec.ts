import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvironmentCheckComponent } from './environment-check.component';
import {MatCardModule} from "@angular/material/card";

describe('EnvironmentCheckComponent', () => {
  let component: EnvironmentCheckComponent;
  let fixture: ComponentFixture<EnvironmentCheckComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnvironmentCheckComponent ],
      imports: [MatCardModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnvironmentCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
