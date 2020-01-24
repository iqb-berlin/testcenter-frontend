import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitNaviButtonsComponent } from './unit-navi-buttons.component';

describe('TcNaviButtonsComponent', () => {
  let component: UnitNaviButtonsComponent;
  let fixture: ComponentFixture<UnitNaviButtonsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UnitNaviButtonsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnitNaviButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
