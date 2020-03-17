import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewworkspaceComponent } from './newworkspace.component';

describe('NewworkspaceComponent', () => {
  let component: NewworkspaceComponent;
  let fixture: ComponentFixture<NewworkspaceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewworkspaceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewworkspaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
