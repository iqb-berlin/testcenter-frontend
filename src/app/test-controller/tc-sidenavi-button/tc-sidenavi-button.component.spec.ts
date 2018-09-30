import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TcSidenaviButtonComponent } from './tc-sidenavi-button.component';

describe('TcSidenaviButtonComponent', () => {
  let component: TcSidenaviButtonComponent;
  let fixture: ComponentFixture<TcSidenaviButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TcSidenaviButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TcSidenaviButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
