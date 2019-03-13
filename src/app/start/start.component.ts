import { MainDataService } from './../maindata.service';
import { Subscription, BehaviorSubject, forkJoin } from 'rxjs';
import { MessageDialogComponent, MessageDialogData, MessageType } from './../iqb-common';
import { MatDialog } from '@angular/material';
import { BackendService, ServerError } from '../backend.service';
import { PersonTokenAndBookletDbId, BookletDataListByCode, LoginData, BookletStatus } from '../app.interfaces';
import { Router } from '@angular/router';
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { StartButtonData } from './start-button-data.class';

@Component({
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent implements OnInit, OnDestroy {
  private loginDataSubscription: Subscription = null;
  private globalErrorMsgSubscription: Subscription = null;
  private dataLoading = false;

  // for template
  private showLoginForm = true;
  private showCodeForm = false;
  private showBookletButtons = false;
  private bookletlist: StartButtonData[] = [];
  private showTestRunningButtons = false;
  private errormsg: ServerError = null;
  private validCodes = [];
  private loginStatusText = ['nicht angemeldet'];

  private testtakerloginform: FormGroup;
  private codeinputform: FormGroup;
  private lastloginname = '';
  private testEndButtonText = 'Test beenden';
  private bookletSelectPrompt = 'Bitte wählen';
  private bookletSelectTitle = 'Bitte wählen';
  private bookletSelectPromptOne = 'Bitte klick auf die Schaltfläche links, um den Test zu starten!';
  private bookletSelectPromptMany = 'Bitte klicken Sie auf eine der Schaltflächen, um einen Test zu starten!';
  private codeInputPrompt = 'Bitte Log-in eingeben, der auf dem Zettel steht!';

  // ??
  // private sessiondata: PersonBooklets;
  // private code = '';
  // private isError = false;
  // private errorMessage = '';


  constructor(private fb: FormBuilder,
    private mds: MainDataService,
    public messsageDialog: MatDialog,
    private router: Router,
    private bs: BackendService) {

  }

  ngOnInit() {
    this.globalErrorMsgSubscription = this.mds.globalErrorMsg$.subscribe(m => {
      this.errormsg = m;
    });
    this.loginDataSubscription = this.mds.loginData$.subscribe(logindata => {
      this.bookletlist = [];
      if (logindata.logintoken.length > 0) {
        // Statustext box
        this.loginStatusText = [];
        this.loginStatusText.push('Studie: ' + logindata.workspaceName);
        this.loginStatusText.push('angemeldet als "' +
          logindata.loginname + (logindata.code.length > 0 ? ('/' + logindata.code + '"') : '"'));
        this.loginStatusText.push('Gruppe: ' + logindata.groupname);

        if (logindata.mode === 'trial') {
          this.loginStatusText.push('Ausführungsmodus "trial": Die Zeit-Beschränkungen, die eventuell ' +
            'für das Testheft oder bestimmte Aufgaben festgelegt wurden, gelten nicht. Sie können ' +
            'Kommentare über das Menü oben rechts speichern.');
        } else if (logindata.mode === 'review') {
          this.loginStatusText.push(
            'Ausführungsmodus "review": Beschränkungen für Zeit und Navigation sind nicht wirksam. Antworten werden ' +
            'nicht gespeichert. Sie können Kommentare über das Menü oben rechts speichern.');
        }

        this.showLoginForm = false;
        let createBookletSelectButtons = false;
        if (logindata.persontoken.length > 0) {
          // test started or just finished
          this.showBookletButtons = false;
          this.showCodeForm = false;
          this.showLoginForm = false;
          if (logindata.booklet === 0) {
            this.showBookletButtons = true;
            this.showTestRunningButtons = false;
            // booklet finished
            // buttons to select booklet

            createBookletSelectButtons = true;
            this.loginStatusText.push('Test nicht gestartet.');
          } else {
            // booklet started
            this.showBookletButtons = false;
            this.showTestRunningButtons = true;

            this.loginStatusText.push('Test gestartet: "' + logindata.bookletlabel + '"');
          }

        } else {
          this.showTestRunningButtons = false;

          this.validCodes = Object.keys(logindata.booklets);
          if (this.validCodes.length > 1) {
            if (logindata.code.length > 0) {
              this.showCodeForm = false;
              this.showBookletButtons = true;
              // code given
              // buttons to select booklet

              createBookletSelectButtons = true;
            } else {
              // code not yet given
              // code prompt

              this.showCodeForm = true;
              this.showBookletButtons = false;
            }
          } else {
            // no code but there is only one
            // buttons to select booklet

            this.showCodeForm = false;
            this.showBookletButtons = true;
            createBookletSelectButtons = true;
          }
        }

        if (createBookletSelectButtons) {
          if (logindata.booklets[logindata.code].length > 0) {
            const myBookletStatusLoadings = [];
            for (const booklet of logindata.booklets[logindata.code]) {
              const myTest = new StartButtonData(booklet);
              myBookletStatusLoadings.push(myTest.getBookletStatus(this.bs, logindata.code));
              this.bookletlist.push(myTest);
            }
            this.dataLoading = true;
            forkJoin(myBookletStatusLoadings).subscribe(allOk => {
              this.dataLoading = false;

              let numberOfOpenBooklets = 0;
              for (const ok of allOk) {
                if (ok) {
                  numberOfOpenBooklets += 1;
                }
              }

              if (numberOfOpenBooklets === 0) {
                this.bookletSelectPrompt = (allOk.length > 1) ? 'Testhefte beendet' : 'Testheft beendet';
                this.bookletSelectTitle = 'Beendet';
              } else if (numberOfOpenBooklets === 1) {
                this.bookletSelectPrompt = this.bookletSelectPromptOne;
                this.bookletSelectTitle = 'Bitte starten';
              } else {
                this.bookletSelectPrompt = this.bookletSelectPromptMany;
                this.bookletSelectTitle = 'Bitte wählen';
              }
            });
          } else {
            this.bookletSelectPrompt = 'Keine Testhefte verfügbar';
          }
        }
      } else {
        // blank start, only login form
        this.validCodes = [];
        this.loginStatusText = ['nicht angemeldet'];
        this.showBookletButtons = false;
        this.showCodeForm = false;
        this.showLoginForm = true;
        this.showTestRunningButtons = false;
      }
    }); // loginDataSubscription


    this.testtakerloginform = this.fb.group({
      testname: this.fb.control(this.lastloginname, [Validators.required, Validators.minLength(3)]),
      testpw: this.fb.control('', [Validators.required, Validators.minLength(3)])
    });

    this.codeinputform = this.fb.group({
      code: this.fb.control('', [Validators.required, Validators.minLength(1)])
    });
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  testtakerlogin() {
    this.dataLoading = true;
    this.bs.login(this.testtakerloginform.get('testname').value, this.testtakerloginform.get('testpw').value).subscribe(
      loginData => {
        if (loginData instanceof ServerError) {
          const e = loginData as ServerError;
          this.mds.globalErrorMsg$.next(e);
          // no change in other data
        } else {
          this.mds.globalErrorMsg$.next(null);
          this.mds.setNewLoginData(loginData);
        }
        this.dataLoading = false;
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
          title: 'Eingabe Personen-Code: Leer',
          content: this.codeInputPrompt,
          type: MessageType.error
        }
      });
    } else if (this.validCodes.indexOf(myCode) < 0) {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Eingabe Personen-Code: Ungültig',
          content: this.codeInputPrompt,
          type: MessageType.error
        }
      });
    } else {
      this.mds.setCode(myCode);
    }
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  startBooklet(b: StartButtonData) {
    this.bs.startBooklet(this.mds.getCode(), b.id, b.label).subscribe(
      startReturnUntyped => {
        if (startReturnUntyped instanceof ServerError) {
          const e = startReturnUntyped as ServerError;
          this.mds.globalErrorMsg$.next(e);
        } else {
          const startReturn = startReturnUntyped as PersonTokenAndBookletDbId;
          this.mds.globalErrorMsg$.next(null);
          // ************************************************

          // by setting bookletDbId$ the test-controller will load the booklet
          this.dataLoading = true;
          this.mds.setBookletDbId(startReturn.persontoken, startReturn.bookletDbId, b.label);
          this.router.navigateByUrl('/t');

          // ************************************************
        }
      }
    );
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  resetLogin() {
    this.mds.setNewLoginData();
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  stopBooklet() {
    this.mds.endBooklet();
  }

  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  ngOnDestroy() {
    if (this.loginDataSubscription !== null) {
      this.loginDataSubscription.unsubscribe();
    }
  }
}
