import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceMonitorComponent } from './workspace-monitor.component';

describe('WorkspaceMonitorComponent', () => {
  let component: WorkspaceMonitorComponent;
  let fixture: ComponentFixture<WorkspaceMonitorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkspaceMonitorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspaceMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
