import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnlockInputComponent } from './unlock-input.component';

describe('UnlockInputComponent', () => {
  let component: UnlockInputComponent;
  let fixture: ComponentFixture<UnlockInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UnlockInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnlockInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
