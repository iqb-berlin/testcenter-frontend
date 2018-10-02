import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StartLockInputComponent } from './start-lock-input.component';

describe('StartLockInputComponent', () => {
  let component: StartLockInputComponent;
  let fixture: ComponentFixture<StartLockInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StartLockInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StartLockInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
