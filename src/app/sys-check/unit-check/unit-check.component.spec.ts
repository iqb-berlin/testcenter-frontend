import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitCheckComponent } from './unit-check.component';

describe('UnitCheckComponent', () => {
  let component: UnitCheckComponent;
  let fixture: ComponentFixture<UnitCheckComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UnitCheckComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnitCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
