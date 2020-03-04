import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SuperadminComponent } from './superadmin.component';

describe('SuperadminComponent', () => {
  let component: SuperadminComponent;
  let fixture: ComponentFixture<SuperadminComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SuperadminComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SuperadminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
