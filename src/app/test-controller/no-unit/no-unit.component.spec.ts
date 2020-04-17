import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NoUnitComponent } from './no-unit.component';

describe('NoUnitComponent', () => {
  let component: NoUnitComponent;
  let fixture: ComponentFixture<NoUnitComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NoUnitComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoUnitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
