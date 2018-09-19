import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TcStatustextComponent } from './tc-statustext.component';

describe('TcStatustextComponent', () => {
  let component: TcStatustextComponent;
  let fixture: ComponentFixture<TcStatustextComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TcStatustextComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TcStatustextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
