import { BehaviorSubject } from 'rxjs';
import { LogindataService } from './../logindata.service';
import { MessageDialogComponent, MessageDialogData, MessageType } from './../iqb-common';
import { MatDialog } from '@angular/material';
import { BackendService, PersonTokenAndBookletId,
  BookletDataListByCode, LoginData, BookletStatus, ServerError } from './backend.service';
import { Router } from '@angular/router';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { StartButtonData } from './start-button-data.class';

@Component({
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent implements OnInit {
  private dataLoading = false;

  // for template
  private showLoginForm = true;
  private loginStatusText = ['nicht angemeldet'];
  private showCodeForm = false;
  private codeInputPromt = 'Bitte gib den Personen-Code ein, den du auf dem Zettel am Platz gefunden hast!';
  private showBookletButtons = false;
  private bookletlist: StartButtonData[] = [];
  private bookletSelectPromptOne = 'Bitte klick auf die Schaltfläche links, um den Test zu starten!';
  private bookletSelectPromptMany = 'Bitte klicken Sie auf eine der Schaltflächen links, um einen Test zu starten!';
  private showTestRunningButtons = false;
  private validCodes = [];

  private testtakerloginform: FormGroup;
  private codeinputform: FormGroup;
  private testEndButtonText = 'Test beenden';

  // ??
  // private sessiondata: PersonBooklets;
  // private code = '';
  // private isError = false;
  // private errorMessage = '';


  constructor(private fb: FormBuilder,
    private lds: LogindataService,
    public messsageDialog: MatDialog,
    private router: Router,
    private bs: BackendService) {

  }

  ngOnInit() {
    this.lds.pageTitle$.next('');
    this.lds.loginStatusText$.subscribe(t => this.loginStatusText = t);

    this.lds.personToken$.subscribe(pt => {
      const bId = this.lds.bookletDbId$.getValue();
      if (pt.length > 0) {
        this.showLoginForm = false;
        this.showCodeForm = false;
        this.showBookletButtons = bId === 0;
        this.showTestRunningButtons = bId > 0;
      } else {
        this.showLoginForm = this.lds.loginToken$.getValue().length === 0;
        this.showCodeForm = this.validCodes.length > 1;
        this.showBookletButtons = false;
        this.showTestRunningButtons = false;
      }
    });

    this.lds.bookletDbId$.subscribe(id => {
      const ptLength = this.lds.personToken$.getValue().length;
      if (id > 0) {
        this.showLoginForm = false;
        this.showCodeForm = false;
        this.showBookletButtons = false;
        this.showTestRunningButtons = ptLength > 0;
      } else {
        this.showLoginForm = ptLength === 0;
        this.showCodeForm = false;
        this.showBookletButtons = ptLength > 0;
        this.showTestRunningButtons = false;
      }
    });

    this.testtakerloginform = this.fb.group({
      testname: this.fb.control(this.lds.loginName$.getValue(), [Validators.required, Validators.minLength(3)]),
      testpw: this.fb.control('', [Validators.required, Validators.minLength(3)])
    });

    this.codeinputform = this.fb.group({
      code: this.fb.control('', [Validators.required, Validators.minLength(1)])
    });

    this.lds.loginMode$.subscribe(m => {
      if (m === 'hot') {
        this.testEndButtonText = 'Test beenden';
      } else {
        this.testEndButtonText = 'Test verlassen';
      }
    });

  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  testtakerlogin() {
    this.dataLoading = true;
    this.bs.login(this.testtakerloginform.get('testname').value, this.testtakerloginform.get('testpw').value).subscribe(
      loginTokenUntyped => {
        if (loginTokenUntyped instanceof ServerError) {
          const e = loginTokenUntyped as ServerError;
          this.lds.globalErrorMsg$.next(e);
          this.dataLoading = false;
          // no change in other data
        } else {
          this.validCodes = [];
          this.bookletlist = [];
          this.lds.personToken$.next('');
          this.lds.personCode$.next('');
          this.lds.globalErrorMsg$.next(null);
          this.lds.workspaceName$.next('');
          this.lds.bookletsByCode$.next(null);
          this.lds.bookletData$.next([]);
          this.lds.bookletDbId$.next(0); // very important: to let test-controller reset booklet data
          this.lds.bookletLabel$.next('');
          this.lds.loginMode$.next('');
          this.lds.loginName$.next('');

          this.lds.loginToken$.next(loginTokenUntyped as string);

          // overwrite all data
          this.bs.getLoginDataByLoginToken(this.lds.loginToken$.getValue()).subscribe(
            loginDataUntyped => {
              if (loginDataUntyped instanceof ServerError) {
                const e = loginDataUntyped as ServerError;
                this.lds.globalErrorMsg$.next(e);
                this.lds.loginToken$.next('');
              } else {
                const loginData = loginDataUntyped as LoginData;
                this.lds.globalErrorMsg$.next(null);
                this.lds.personToken$.next('');
                this.lds.bookletsByCode$.next(loginData.booklets);
                this.lds.bookletData$.next([]);
                this.lds.groupName$.next(loginData.groupname);
                this.lds.workspaceName$.next(loginData.workspaceName);
                this.lds.loginMode$.next(loginData.mode);
                this.lds.loginName$.next(loginData.loginname);

                this.validCodes = Object.keys(loginData.booklets);
                this.showLoginForm = false;

                if (this.validCodes.length > 1) {
                  this.showCodeForm = true;
                } else {
                  this.lds.personCode$.next((this.validCodes.length > 0) ? this.validCodes[0] : '');
                  this.showCodeForm = false;
                  this.showBookletButtons = true;
                  this.lds.bookletData$.next(loginData.booklets['']);
                  this.bookletlist = this.getStartButtonData();
                }
              }
              this.dataLoading = false;
            });
          }
      }
    );
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  codeinput() {
    const myCode = this.codeinputform.get('code').value as string;
    this.lds.personToken$.next('');
    if (myCode.length === 0) {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Eingabe Personen-Code',
          content: 'Bitte geben Sie einen Personen-Code ein!.',
          type: MessageType.error
        }
      });
    } else if (this.validCodes.indexOf(myCode) < 0) {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Eingabe Personen-Code',
          content: 'Für diesen Personen-Code liegen keine Informationen vor.',
          type: MessageType.error
        }
      });
    } else {
      this.lds.personCode$.next(myCode);
      this.showCodeForm = false;
      this.showBookletButtons = true;
      const codeToBooklets = this.lds.bookletsByCode$.getValue();
      this.lds.bookletData$.next(codeToBooklets[myCode]);
      this.bookletlist = this.getStartButtonData();
    }
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  getStartButtonData(): StartButtonData[] {
    const myreturn: StartButtonData[] = [];
    const lt = this.lds.loginToken$.getValue();
    const pt = this.lds.personToken$.getValue();
    const code = this.lds.personCode$.getValue();

    const bookletData = this.lds.bookletData$.getValue();
    if (pt.length > 0 || lt.length > 0) {
      for (const booklet of bookletData) {
        const myTest = new StartButtonData(booklet.id, booklet.label, booklet.filename);
        if (pt.length > 0) {
          myTest.getBookletStatusByPersonToken(this.bs, pt);
        } else {
          myTest.getBookletStatusByLoginToken(this.bs, lt, code);
        }
        myreturn.push(myTest);
      }
    }
    return myreturn;
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  buttonStartTest(b: StartButtonData) {
    const lt = this.lds.loginToken$.getValue();
    const pt = this.lds.personToken$.getValue();
    const code = this.lds.personCode$.getValue();

    if (pt.length > 0 || lt.length > 0) {
      if (pt.length > 0) {
        this.bs.startBookletByPersonToken(pt, b.filename).subscribe(
          bookletIdUntyped => {
            if (bookletIdUntyped instanceof ServerError) {
              const e = bookletIdUntyped as ServerError;
              this.lds.globalErrorMsg$.next(e);
            } else {
              const bookletId = bookletIdUntyped as number;
              this.lds.globalErrorMsg$.next(null);
              if (bookletId > 0) {
                this.lds.bookletDbId$.next(bookletId);
                this.lds.bookletLabel$.next(b.label);
                this.lds.globalErrorMsg$.next(null);
                // ************************************************

                // by setting bookletDbId$ the test-controller will load the booklet
                this.router.navigateByUrl('/t');

                // ************************************************
              } else {
                this.lds.globalErrorMsg$.next(new ServerError(401, 'ungültige Anmeldung', 'start.component'));
              }
            }
          }
        );
      } else {
        this.bs.startBookletByLoginToken(lt, code, b.filename).subscribe(
          startDataUntyped => {
            if (startDataUntyped instanceof ServerError) {
              const e = startDataUntyped as ServerError;
              this.lds.globalErrorMsg$.next(e);
            } else {
              const startData = startDataUntyped as PersonTokenAndBookletId;

              if (startData.b > 0) {
                this.lds.personToken$.next(startData.pt);
                this.lds.globalErrorMsg$.next(null);
                this.lds.bookletLabel$.next(b.label);
                this.lds.bookletDbId$.next(startData.b); // as last to trigger auth with success!
                // ************************************************

                // by setting bookletDbId$ the test-controller will load the booklet
                this.router.navigateByUrl('/t');

                // ************************************************
              } else {
                this.lds.globalErrorMsg$.next(new ServerError(401, 'ungültige Anmeldung', 'start.component'));
              }
            }
          }
        );
      }
    } else {
      this.lds.globalErrorMsg$.next(new ServerError(401, 'ungültige Anmeldung', 'start.component'));
    }
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  changeLogin() {
    this.showBookletButtons = false;
    this.showCodeForm = false;
    this.showLoginForm = true;
    this.showTestRunningButtons = false;
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  changeCode() {
    this.showBookletButtons = false;
    this.showCodeForm = true;
    this.showLoginForm = false;
    this.showTestRunningButtons = false;
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  buttonEndTest() {
    const auth = this.lds.authorisation$.getValue();
    if ((this.lds.loginMode$.getValue() === 'hot') && (auth !== null)) {
      this.bs.endBooklet(auth.personToken, auth.bookletId).subscribe(
        finOkUntyped => {
          if (finOkUntyped instanceof ServerError) {
            const e = finOkUntyped as ServerError;
            this.lds.globalErrorMsg$.next(e);
          } else {
            const finOK = finOkUntyped as boolean;
            this.lds.globalErrorMsg$.next(null);
            if (finOK) {
              this.showLoginForm = false;
              this.showCodeForm = false;
              this.showBookletButtons = true;
              this.showTestRunningButtons = false;
              this.resetBooklet();
            }
          }
      });
    } else {
      this.showLoginForm = false;
      this.showCodeForm = false;
      this.showBookletButtons = true;
      this.showTestRunningButtons = false;
      this.resetBooklet();
    }
  }

  private resetBooklet() {
    this.lds.bookletDbId$.next(0);
    this.lds.bookletLabel$.next('');
    this.bookletlist = this.getStartButtonData();
  }
}
