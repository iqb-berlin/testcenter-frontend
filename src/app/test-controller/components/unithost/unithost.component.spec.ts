import {
  ComponentFixture, TestBed, waitForAsync
} from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { UnithostComponent } from './unithost.component';
import { ReviewDialogComponent } from '../review-dialog/review-dialog.component';
import { TestControllerService } from '../../services/test-controller.service';
import { BackendService } from '../../services/backend.service';
import { MainDataService } from '../../../shared/shared.module';
// eslint-disable-next-line import/extensions
import { BookletConfig } from '../../../config/booklet-config';
import { VeronaNavigationDeniedReason } from '../../interfaces/verona.interfaces';

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

const MockTestControllerService = {
  bookletConfig,
  navigationDenial: new Subject<{ sourceUnitSequenceId: number, reason: VeronaNavigationDeniedReason[] }>()
};
const MockBackendService = { };
const MockMainDataService = {
  postMessage$: new Subject()
};
const MockActivatedRoute = {
  params: new Subject<Params>()
};

describe('UnithostComponent', () => {
  let component: UnithostComponent;
  let fixture: ComponentFixture<UnithostComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        UnithostComponent,
        ReviewDialogComponent
      ],
      imports: [
        CommonModule,
        MatSnackBarModule
      ],
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

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getEnabledNavigationTargets', () => {
    it('should return the correct targets', () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const getEnabledNavigationTargets = UnithostComponent['getEnabledNavigationTargets'];
      expect(getEnabledNavigationTargets(2, 2, 5)).toEqual(['next', 'last', 'end']);
      expect(getEnabledNavigationTargets(3, 2, 5)).toEqual(['next', 'previous', 'first', 'last', 'end']);
      expect(getEnabledNavigationTargets(5, 2, 5)).toEqual(['previous', 'first', 'end']);
      expect(getEnabledNavigationTargets(1, 1, 1)).toEqual(['end']);
    });
  });
});
