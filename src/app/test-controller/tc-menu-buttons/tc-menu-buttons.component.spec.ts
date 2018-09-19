import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TcMenuButtonsComponent } from './tc-menu-buttons.component';

describe('TcMenuButtonsComponent', () => {
  let component: TcMenuButtonsComponent;
  let fixture: ComponentFixture<TcMenuButtonsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TcMenuButtonsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TcMenuButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
