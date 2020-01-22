import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SysCheckComponent } from './sys-check.component';

describe('RunComponent', () => {
  let component: SysCheckComponent;
  let fixture: ComponentFixture<SysCheckComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SysCheckComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SysCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
