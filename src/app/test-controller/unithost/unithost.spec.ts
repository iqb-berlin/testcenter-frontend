import {
  ComponentFixture, TestBed, waitForAsync
} from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { UnithostComponent } from './unithost.component';
import { ReviewDialogComponent } from '../review-dialog/review-dialog.component';
import { TestControllerService } from '../test-controller.service';
import { BackendService } from '../backend.service';
import { MainDataService } from '../../maindata.service';
// eslint-disable-next-line import/extensions
import { BookletConfig } from '../../config/booklet-config';

const bookletConfig = new BookletConfig();
bookletConfig.setFromKeyValuePairs({
  loading_mode: 'LAZY',
  logPolicy: 'rich',
  pagingMode: 'separate',
  stateReportPolicy: 'eager',
  page_navibuttons: 'SEPARATE_BOTTOM',
  unit_navibuttons: 'FULL',
  unit_menu: 'OFF',
  force_presentation_complete: 'OFF',
  force_responses_complete: 'OFF',
  unit_screenheader: 'EMPTY',
  unit_title: 'ON',
  unit_show_time_left: 'OFF'
});

const MockTestControllerService = { bookletConfig };
const MockBackendService = { };
const MockMainDataService = {
  postMessage$: new Subject()
};
const MockActivatedRoute = {
  route: {
    params: of({ u: 1 })
  }
};

describe('UnithostComponent', () => {
  let component: UnithostComponent;
  let fixture: ComponentFixture<UnithostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ReviewDialogComponent],
      imports: [CommonModule],
      providers: [
        { provide: TestControllerService, useValue: MockTestControllerService },
        { provide: BackendService, useValue: MockBackendService },
        { provide: MainDataService, useValue: MockMainDataService },
        { provide: ActivatedRoute, useValue: MockActivatedRoute }
      ]
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

  it('[getEnabledNavigationTargets] should return the correct targets', () => {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    const getEnabledNavigationTargets = component['getEnabledNavigationTargets'];
    expect(getEnabledNavigationTargets(2, 2, 5)).toEqual(['next', 'last', 'end']);
    expect(getEnabledNavigationTargets(3, 2, 5)).toEqual(['next', 'previous', 'first', 'last', 'end']);
    expect(getEnabledNavigationTargets(5, 2, 5)).toEqual(['previous', 'first', 'end']);
    expect(getEnabledNavigationTargets(1, 1, 1)).toEqual(['end']);
  });
});
