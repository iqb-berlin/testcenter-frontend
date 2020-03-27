import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SysCheckStarterComponent } from './sys-check-starter.component';

describe('SysCheckStarterComponent', () => {
  let component: SysCheckStarterComponent;
  let fixture: ComponentFixture<SysCheckStarterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SysCheckStarterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SysCheckStarterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
