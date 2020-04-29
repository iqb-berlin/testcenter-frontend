import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteDispatcherComponent } from './route-dispatcher.component';
import {AppRoutingModule} from "../../app-routing.module";

describe('RouteDispatcherComponent', () => {
  let component: RouteDispatcherComponent;
  let fixture: ComponentFixture<RouteDispatcherComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RouteDispatcherComponent ],
      imports: [AppRoutingModule]
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
