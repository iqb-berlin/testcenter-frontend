import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkCheckComponent } from './network-check.component';

describe('NetworkCheckComponent', () => {
  let component: NetworkCheckComponent;
  let fixture: ComponentFixture<NetworkCheckComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NetworkCheckComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
