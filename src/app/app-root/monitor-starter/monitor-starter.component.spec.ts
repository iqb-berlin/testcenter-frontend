import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonitorStarterComponent } from './monitor-starter.component';

describe('MonitorStarterComponent', () => {
  let component: MonitorStarterComponent;
  let fixture: ComponentFixture<MonitorStarterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonitorStarterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonitorStarterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
