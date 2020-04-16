import {Component, OnInit, ViewChild} from '@angular/core';
import {Router} from "@angular/router";
import {MainDataService} from "../../maindata.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {CustomtextService, MessageDialogComponent, MessageDialogData, MessageType} from "iqb-components";
import {MatDialog} from "@angular/material/dialog";
import {AuthData} from "../../app.interfaces";
import {BackendService} from "../../backend.service";

@Component({
  templateUrl: './code-input.component.html'
})
export class CodeInputComponent implements OnInit{
  @ViewChild('codeInputControl') codeInputControl: FormControl;
  problemText = '';

  codeinputform = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.minLength(2)]),
  });

  constructor(
    private router: Router,
    public messageDialog: MatDialog,
    public cts: CustomtextService,
    public bs: BackendService,
    public mds: MainDataService
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      const element = <any>document.querySelector('.mat-input-element[formControlName="code"]');
      if (element) {
        element.focus();
      }
    })
  }

  codeinput() {
    const codeData = this.codeinputform.value;
    if (codeData['code'].length === 0) {
      this.messageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          // @ts-ignore
          title: this.cts.getCustomText('login_codeInputTitle') + ': Leer',
          // @ts-ignore
          content: this.cts.getCustomText('login_codeInputPrompt'),
          type: MessageType.error
        }
      });
    } else {
      this.bs.codeLogin(codeData['code']).subscribe(
        authData => {
          this.problemText = '';
          if (typeof authData === 'number') {
            const errCode = authData as number;
            if (errCode === 400) {
              this.problemText = 'Der Code ist leider nicht gültig.';
            } else {
              this.problemText = 'Problem bei der Anmeldung.';
              // app.interceptor will show error message
            }
          } else {
            const authDataTyped = authData as AuthData;
            if (authDataTyped.customTexts) {
              this.cts.addCustomTexts(authDataTyped.customTexts);
            }
            this.mds.setAuthData(authDataTyped);

            // let the app-root routing guard decide where to go to
            this.router.navigate(['/r']);
          }
        })
    }
  }

  resetLogin() {
    this.mds.setAuthData();
    this.router.navigate(['/']);
  }
}
