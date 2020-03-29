import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteDispatcherComponent } from './route-dispatcher.component';

describe('RouteDispatcherComponent', () => {
  let component: RouteDispatcherComponent;
  let fixture: ComponentFixture<RouteDispatcherComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RouteDispatcherComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RouteDispatcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
