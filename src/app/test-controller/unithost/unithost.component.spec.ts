import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnithostComponent } from './unithost.component';

describe('UnithostComponent', () => {
  let component: UnithostComponent;
  let fixture: ComponentFixture<UnithostComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UnithostComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnithostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
