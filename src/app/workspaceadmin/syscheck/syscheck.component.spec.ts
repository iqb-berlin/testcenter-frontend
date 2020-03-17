import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SyscheckComponent } from './syscheck.component';

describe('SyscheckComponent', () => {
  let component: SyscheckComponent;
  let fixture: ComponentFixture<SyscheckComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SyscheckComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SyscheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
