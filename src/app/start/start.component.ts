import { BehaviorSubject } from 'rxjs';
import { LogindataService, PersonTokenAndBookletId } from './../logindata.service';
import { MessageDialogComponent, MessageDialogData, MessageType } from './../iqb-common';
import { MatDialog } from '@angular/material';
import { BackendService, BookletData,
  BookletnamesByCode, LoginData, BookletStatus, ServerError } from './../backend.service';
import { Router } from '@angular/router';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent implements OnInit {
  // for template
  private showLoginForm = true;
  private loginStatusText = ['nicht angemeldet'];
  private showCodeForm = false;
  private codeInputPromt = 'Bitte gib den Personen-Code ein, den du auf dem Zettel am Platz gefunden hast!';
  private showBookletButtons = false;
  private bookletlist: StartButtonData[] = [];
  private bookletSelectPromptOne = 'Bitte klick auf die Schaltfläche rechts, um den Test zu starten!';
  private bookletSelectPromptMany = 'Bitte klicken Sie auf eine der Schaltflächen rechts, um einen Test zu starten!';
  private showTestRunningButtons = false;
  private validCodes = [];

  private testtakerloginform: FormGroup;
  private codeinputform: FormGroup;
  private errorMsg = '';

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
    this.lds.pageTitle$.next('IQB-Testcenter - Start');
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

    this.lds.globalErrorMsg$.subscribe(m => this.errorMsg = m);

    this.testtakerloginform = this.fb.group({
      testname: this.fb.control(this.lds.loginName$.getValue(), [Validators.required, Validators.minLength(3)]),
      testpw: this.fb.control('', [Validators.required, Validators.minLength(3)])
    });

    this.codeinputform = this.fb.group({
      code: this.fb.control('', [Validators.required, Validators.minLength(1)])
    });

  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  testtakerlogin() {
    this.bs.login(this.testtakerloginform.get('testname').value, this.testtakerloginform.get('testpw').value).subscribe(
      loginTokenUntyped => {
        if (loginTokenUntyped instanceof ServerError) {
          const e = loginTokenUntyped as ServerError;
          this.lds.globalErrorMsg$.next(e.code.toString() + ': ' + e.label);
          // no change in other data
        } else {
          this.validCodes = [];
          this.bookletlist = [];
          this.lds.personToken$.next('');
          this.lds.personCode$.next('');
          this.lds.globalErrorMsg$.next('');
          this.lds.workspaceName$.next('');
          this.lds.bookletsByCode$.next(null);
          this.lds.bookletData$.next([]);
          this.lds.bookletDbId$.next(0);
          this.lds.bookletLabel$.next('');
          this.lds.loginMode$.next('');
          this.lds.loginName$.next('');

          this.lds.loginToken$.next(loginTokenUntyped as string);

          // overwrite all data
          this.bs.getLoginDataByLoginToken(this.lds.loginToken$.getValue()).subscribe(
            loginDataUntyped => {
              if (loginDataUntyped instanceof ServerError) {
                const e = loginDataUntyped as ServerError;
                this.lds.globalErrorMsg$.next(e.code.toString() + ': ' + e.label);
                this.lds.loginToken$.next('');
              } else {
                const loginData = loginDataUntyped as LoginData;
                this.lds.personToken$.next('');
                this.lds.bookletsByCode$.next(loginData.codeswithbooklets);
                this.lds.bookletData$.next(loginData.booklets);
                this.lds.groupName$.next(loginData.groupname);
                this.lds.workspaceName$.next(loginData.workspaceName);
                this.lds.loginMode$.next(loginData.mode);
                this.lds.loginName$.next(loginData.loginname);

                this.validCodes = Object.keys(loginData.codeswithbooklets);
                this.showLoginForm = false;

                if (this.validCodes.length > 1) {
                  this.showCodeForm = true;
                } else {
                  this.lds.personCode$.next((this.validCodes.length > 0) ? this.validCodes[0] : '');
                  this.showCodeForm = false;
                  this.showBookletButtons = true;
                  this.bookletlist = this.getStartButtonData();
                }
              }
            });
          }
      }
    );
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  codeinput() {
    const myCode = this.codeinputform.get('code').value as string;
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
      this.lds.personToken$.next('');
      this.showCodeForm = false;
      this.showBookletButtons = true;
      this.bookletlist = this.getStartButtonData();
    }
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  getStartButtonData(): StartButtonData[] {
    const myreturn: StartButtonData[] = [];
    const codeToBooklets = this.lds.bookletsByCode$.getValue();
    const bookletData = this.lds.bookletData$.getValue();
    const lt = this.lds.loginToken$.getValue();
    const pt = this.lds.personToken$.getValue();
    const code = this.lds.personCode$.getValue();

    if (pt.length > 0 || lt.length > 0) {
      const myBooklets = codeToBooklets[code];

      for (const booklet of bookletData) {
        if (myBooklets.indexOf(booklet.name) >= 0) {
          const myTest = new StartButtonData(booklet.name, booklet.title, booklet.filename);
          if (pt.length > 0) {
            myTest.getBookletStatusByPersonToken(this.bs, pt);
          } else {
            myTest.getBookletStatusByLoginToken(this.bs, lt, code);
          }
          myreturn.push(myTest);
        }
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
              this.lds.globalErrorMsg$.next(e.code.toString() + ': ' + e.label);
            } else {
              const bookletId = bookletIdUntyped as number;
              if (bookletId > 0) {
                this.lds.bookletDbId$.next(bookletId);
                this.lds.bookletLabel$.next(b.title);
                // ************************************************

                // by setting bookletDbId$ the test-controller will load the booklet
                this.router.navigateByUrl('/t');

                // ************************************************
              } else {
                this.lds.globalErrorMsg$.next('ungültige Anmeldung');
              }
            }
          }
        );
      } else {
        this.bs.startBookletByLoginToken(lt, code, b.filename).subscribe(
          startDataUntyped => {
            if (startDataUntyped instanceof ServerError) {
              const e = startDataUntyped as ServerError;
              this.lds.globalErrorMsg$.next(e.code.toString() + ': ' + e.label);
            } else {
              const startData = new PersonTokenAndBookletId(startDataUntyped as string);

              if (startData.bookletId > 0) {
                this.lds.bookletDbId$.next(startData.bookletId);
                this.lds.personToken$.next(startData.personToken);
                this.lds.bookletLabel$.next(b.title);
                // ************************************************

                // by setting bookletDbId$ the test-controller will load the booklet
                this.router.navigateByUrl('/t');

                // ************************************************
              } else {
                this.lds.globalErrorMsg$.next('ungültige Anmeldung');
              }
            }
          }
        );
          }
    } else {
      this.lds.globalErrorMsg$.next('ungültige Anmeldung');
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
}

// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

export class StartButtonData {
  name: string;
  title: string;
  filename: string;
  isEnabled: boolean;
  statustxt: string;
  lastUnit: number;

  constructor(
    name: string,
    title: string,
    filename: string
  ) {
    this.name = name;
    this.title = title;
    this.filename = filename;
    this.isEnabled = false;
    this.statustxt = 'Bitte warten';
  }

  public getBookletStatusByLoginToken(bs: BackendService, loginToken: string, code: string) {
    bs.getBookletStatusByNameAndLoginToken(loginToken, code, this.name).subscribe(respDataUntyped => {
      if (respDataUntyped instanceof ServerError) {
        const e = respDataUntyped as ServerError;
        this.statustxt = e.code.toString() + ': ' + e.label;
      } else {
        const respData = respDataUntyped as BookletStatus;
        this.statustxt = respData.statusLabel;
        this.isEnabled = respData.canStart;
        this.lastUnit = respData.lastUnit;
      }
    });
  }

  public getBookletStatusByPersonToken(bs: BackendService, personToken: string) {
    bs.getBookletStatusByNameAndPersonToken(personToken, this.name).subscribe(respDataUntyped => {
      if (respDataUntyped instanceof ServerError) {
        const e = respDataUntyped as ServerError;
        this.statustxt = e.code.toString() + ': ' + e.label;
      } else {
        const respData = respDataUntyped as BookletStatus;
        this.statustxt = respData.statusLabel;
        this.isEnabled = respData.canStart;
        this.lastUnit = respData.lastUnit;
      }
    });
  }
}
