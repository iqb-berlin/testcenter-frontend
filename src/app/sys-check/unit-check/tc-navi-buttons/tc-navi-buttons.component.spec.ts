import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TcNaviButtonsComponent } from './tc-navi-buttons.component';

describe('TcNaviButtonsComponent', () => {
  let component: TcNaviButtonsComponent;
  let fixture: ComponentFixture<TcNaviButtonsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TcNaviButtonsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TcNaviButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
