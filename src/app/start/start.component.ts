import { MainDataService } from '../maindata.service';
import { Subscription, forkJoin } from 'rxjs';
import {CustomtextService, MessageDialogComponent, MessageDialogData, MessageType, ServerError} from 'iqb-components';
import { BackendService } from '../backend.service';
import {PersonTokenAndTestId, LoginData, WorkspaceData} from '../app.interfaces';
import { Router } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { StartButtonData } from './start-button-data.class';
import { appconfig } from '../app.config';
import {MatDialog} from "@angular/material/dialog";

@Component({
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent implements OnInit, OnDestroy {
  public dataLoading = false;
  public showLoginForm = true;
  public showCodeForm = false;
  public showBookletButtons = false;
  public bookletlist: StartButtonData[] = [];
  public showTestRunningButtons = false;
  public showAdminSelection = false;

  private loginDataSubscription: Subscription = null;

  // for template
  private validCodes = [];
  private loginStatusText = ['nicht angemeldet'];
  public bookletSelectTitle = 'Bitte wählen';

  private testtakerloginform: FormGroup;
  private codeinputform: FormGroup;
  private lastloginname = '';
  public bookletSelectPrompt = 'Bitte wählen';

  // ??
  // private sessiondata: PersonBooklets;
  // private code = '';
  // private isError = false;
  // private errorMessage = '';


  constructor(private fb: FormBuilder,
    public mds: MainDataService,
    public messsageDialog: MatDialog,
    private router: Router,
    private bs: BackendService,
    public cts: CustomtextService) {
  }

  ngOnInit() {
    this.loginDataSubscription = this.mds.loginData$.subscribe(logindata => {
      this.bookletlist = [];
      if (logindata.adminToken.length > 0) {
        this.showLoginForm = false;
        this.showAdminSelection = true;
        this.showCodeForm = false;
        this.showBookletButtons = false;
        this.showTestRunningButtons = false;
        this.loginStatusText = [];
        this.loginStatusText.push('Admin-Bereich ');
        console.log(logindata);
        this.loginStatusText.push('angemeldet als ' + logindata.name);
        if (logindata.isSuperadmin) {
          this.loginStatusText.push('Rechte auch für Anlegen/Löschen von Nutzern und Workspaces');
        }
      } else if (logindata.loginToken.length > 0) {
        // Statustext box
        this.showAdminSelection = false;
        this.loginStatusText = [];
        this.loginStatusText.push('Studie: ' + logindata.workspaceName);
        this.loginStatusText.push('angemeldet als "' +
          logindata.name + (logindata.code.length > 0 ? ('/' + logindata.code + '"') : '"'));
        this.loginStatusText.push('Gruppe: ' + logindata.groupName);

        if (logindata.mode === 'run-trial') {
          // @ts-ignore
          const tmt = this.cts.getCustomText('login_trialmodeText');
          if (tmt.length > 0) {
            this.loginStatusText.push(tmt);
          }
        } else if (logindata.mode === 'run-review') {
          // @ts-ignore
          const tmt = this.cts.getCustomText('login_reviewmodeText');
          if (tmt.length > 0) {
            this.loginStatusText.push(tmt);
          }
        }

        this.showLoginForm = false;
        let createBookletSelectButtons = false;
        if (logindata.personToken.length > 0) {
          // test started or just finished
          this.showBookletButtons = false;
          this.showCodeForm = false;
          this.showLoginForm = false;
          if (logindata.testId === 0) {
            this.showBookletButtons = true;
            this.showTestRunningButtons = false;
            // booklet finished
            // buttons to select booklet

            createBookletSelectButtons = true;
            this.loginStatusText.push('Nicht gestartet.');
          } else {
            // booklet started
            this.showBookletButtons = false;
            this.showTestRunningButtons = true;

            this.loginStatusText.push('Gestartet: "' + logindata.bookletLabel + '"');
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
            // no code but there is only one code
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
                this.bookletSelectTitle = 'Beendet';
                // @ts-ignore
                this.bookletSelectPrompt = this.cts.getCustomText('login_bookletSelectPromptNull');
              } else if (numberOfOpenBooklets === 1) {
                this.bookletSelectPrompt = 'Bitte links auf den Testheft-Schalter klicken!';
                this.bookletSelectTitle = 'Bitte starten';
                // @ts-ignore
                this.bookletSelectPrompt = this.cts.getCustomText('login_bookletSelectPromptOne');
              } else {
                this.bookletSelectPrompt = 'Bitte links ein Testheft wählen und klicken!';
                this.bookletSelectTitle = 'Bitte wählen';
                // @ts-ignore
                this.bookletSelectPrompt = this.cts.getCustomText('login_bookletSelectPromptMany');
              }
            });
          } else {
            this.bookletSelectTitle = 'Kein Zugriff';
            this.bookletSelectPrompt = 'Keine Informationen zu dieser Anmeldung verfügbar';
          }
        }
      } else {
        // blank start, only login form
        this.validCodes = [];
        this.loginStatusText = ['nicht angemeldet'];
        this.showBookletButtons = false;
        this.showCodeForm = false;
        this.showAdminSelection = false;
        this.showLoginForm = true;
        this.showTestRunningButtons = false;
      }
    }); // loginDataSubscription


    this.testtakerloginform = this.fb.group({
      testname: this.fb.control(this.lastloginname, [Validators.required, Validators.minLength(3)]),
      testpw: this.fb.control('', [])
    });

    this.codeinputform = this.fb.group({
      code: this.fb.control('', [Validators.required, Validators.minLength(1)])
    });
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  login() {
    this.dataLoading = true;
    this.bs.login(this.testtakerloginform.get('testname').value, this.testtakerloginform.get('testpw').value).subscribe(
      loginData => {
        if (loginData instanceof ServerError) {
          const e = loginData as ServerError;
          this.mds.globalErrorMsg$.next(e);
          this.mds.addCustomtextsFromDefList(appconfig.customtextsLogin);
          // no change in other data
        } else {
          this.mds.globalErrorMsg$.next(null);
          if ((loginData as LoginData).customTexts) {
            this.cts.addCustomTexts((loginData as LoginData).customTexts);
          }
          // this.mds.setNewLoginData(loginData as LoginData); TODO delete component
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
          // @ts-ignore
          title: this.cts.getCustomText('login_codeInputTitle') + ': Leer',
          // @ts-ignore
          content: this.cts.getCustomText('login_codeInputPrompt'),
          type: MessageType.error
        }
      });
    } else if (this.validCodes.indexOf(myCode) < 0) {
      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          // @ts-ignore
          title: this.cts.getCustomText('login_codeInputTitle') + ': Ungültig',
          // @ts-ignore
          content: this.cts.getCustomText('login_codeInputPrompt'),
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
          const startReturn = startReturnUntyped as PersonTokenAndTestId;
          this.mds.globalErrorMsg$.next(null);
          // ************************************************

          // by setting bookletDbId$ the test-controller will load the booklet
          this.dataLoading = true;
          this.mds.setBookletDbId(startReturn.personToken, startReturn.testId, b.label);
          this.router.navigateByUrl('/t');

          // ************************************************
        }
      }
    );
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  resetLogin() {
    // this.mds.setNewLoginData(); TODO fix
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  stopBooklet() {
    this.mds.endBooklet();
  }

  buttonGotoWorkspaceAdmin(ws: WorkspaceData) {
    this.router.navigateByUrl('/admin/' + ws.id.toString() + '/files');
  }

  buttonGotoWorkspaceMonitor(ws: WorkspaceData) {
    this.router.navigateByUrl('/wsmonitor/' + ws.id.toString());
  }

  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  ngOnDestroy() {
    if (this.loginDataSubscription !== null) {
      this.loginDataSubscription.unsubscribe();
    }
  }
}
