import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminStarterComponent } from './admin-starter.component';

describe('WorkspaceAdminStarterComponent', () => {
  let component: AdminStarterComponent;
  let fixture: ComponentFixture<AdminStarterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminStarterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminStarterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
