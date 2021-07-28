import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CustomtextService } from 'iqb-components';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, Subject } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { BackendService } from '../group-monitor/backend.service';
import { CommandService } from './command.service';
import { TestControllerComponent } from './test-controller.component';
import { MainDataService } from '../maindata.service';
import {
  Command, TestControllerState, TestData, WindowFocusState
} from './test-controller.interfaces';
import { ConnectionStatus } from '../shared/websocket-backend.service';
import { TestControllerService } from './test-controller.service';
import { AppError } from '../app.interfaces';
import { TestMode } from '../config/test-mode';
// eslint-disable-next-line import/extensions
import { BookletConfig } from '../config/booklet-config';
import { MaxTimerData, Testlet } from './test-controller.classes';

const testBookletXML = `<Booklet>
  <Metadata>
    <Id>BookletId</Id>
    <Label>Label</Label>
  </Metadata>

  <BookletConfig>
    <Config key="force_presentation_complete">ON</Config>
    <Config key="force_response_complete">OFF</Config>
  </BookletConfig>

  <Units>
    <Restrictions>
      <DenyNavigation force_presentation_complete="OFF" force_response_complete="ON"/>
      <TimeMax minutes="10" />
    </Restrictions>
    <Unit id="u1" label="l" />
    <Testlet id="t1">
     <Restrictions>
       <CodeToEnter code="d" />
       <TimeMax minutes="5" />
       <DenyNavigation force_presentation_complete="ON" force_response_complete="OFF"/>
     </Restrictions>
     <Unit id="u2" label="l" />
     <Testlet id="t2">
       <Restrictions>
         <CodeToEnter code="d" />
         <TimeMax minutes="3" />
         <DenyNavigation force_presentation_complete="OFF" force_response_complete="ON"/>
       </Restrictions>
       <Unit id="u3" label="l" />
     </Testlet>
     <Unit id="u4" label="l" />
    </Testlet>
    <Unit id="u5" label="l" />
  </Units>
</Booklet>`;

const testData$ = new Subject<boolean|TestData>();
const command$ = new Subject<Command>();
const connectionStatus$ = new Subject<ConnectionStatus>();
const appWindowHasFocus$ = new Subject<WindowFocusState>();
const appError$ = new Subject<AppError>();
const testStatus$ = new BehaviorSubject<TestControllerState>(TestControllerState.ERROR);
const maxTimeTimer$ = new Subject<MaxTimerData>();
const routeParams$ = new Subject<Params>();

const MockBackendService = {
  getTestData: () => testData$
};

const MockCommandService = {
  command$,
  connectionStatus$
};

const MockMainDataService = {
  progressVisualEnabled: false,
  appWindowHasFocus$,
  appError$
};

const MockTestControllerService = {
  testStatus$,
  maxTimeTimer$,
  testMode: new TestMode(),
  bookletConfig: new BookletConfig(),
  testStatusEnum: TestControllerState,
  setUnitNavigationRequest: () => {}
};

const MockActivatedRoute = {
  params: routeParams$
};

fdescribe('TestControllerComponent', () => {
  let component: TestControllerComponent;
  let fixture: ComponentFixture<TestControllerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TestControllerComponent
      ],
      imports: [
        CommonModule,
        MatIconModule,
        MatDialogModule,
        RouterTestingModule.withRoutes([{ path: 'yourpath', redirectTo: '' }]),
        HttpClientModule
      ],
      providers: [
        CustomtextService,
        MatSnackBar,
        { provide: TestControllerService, useValue: MockTestControllerService },
        { provide: BackendService, useValue: MockBackendService },
        { provide: CommandService, useValue: MockCommandService },
        { provide: MainDataService, useValue: MockMainDataService },
        { provide: ActivatedRoute, useValue: MockActivatedRoute },
        { provide: 'APP_VERSION', useValue: '0000' },
        { provide: 'IS_PRODUCTION_MODE', useValue: false }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestControllerComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getBookletFromXml', () => {
    it('should read booklet content correctly', () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const booklet = component['getBookletFromXml'](testBookletXML);

      const pt = (ttt: Testlet) => {
        console.log(`========${ttt.id}` ?? ttt.sequenceId ?? 'ð');
        console.log(ttt);
        if (ttt.children) {
          ttt.children.forEach(pt);
        }
      };

      pt(booklet);
    });
  });
});
