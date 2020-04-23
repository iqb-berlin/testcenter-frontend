import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacyComponent } from './privacy.component';
import {AppRoutingModule} from "../../app-routing.module";
import {IqbComponentsModule} from "iqb-components";

describe('PrivacyComponent', () => {
  let component: PrivacyComponent;
  let fixture: ComponentFixture<PrivacyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrivacyComponent ],
      imports: [
        AppRoutingModule,
        IqbComponentsModule
      ],

    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
