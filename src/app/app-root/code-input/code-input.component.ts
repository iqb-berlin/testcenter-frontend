import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {MainDataService} from "../../maindata.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {CustomtextService, MessageDialogComponent, MessageDialogData, MessageType} from "iqb-components";
import {MatDialog} from "@angular/material/dialog";

@Component({
  templateUrl: './code-input.component.html'
})
export class CodeInputComponent {
  codeinputform = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.minLength(2)]),
  });

  constructor(
    private router: Router,
    public messageDialog: MatDialog,
    public cts: CustomtextService,
    public mds: MainDataService
  ) { }

  codeinput() {
    const loginData = this.mds.loginData$.getValue();
    const validCodes = Object.keys(loginData.booklets);
    const myCode = this.codeinputform.get('code').value as string;
    if (myCode.length === 0) {
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
    } else if (validCodes.indexOf(myCode) < 0) {
      this.messageDialog.open(MessageDialogComponent, {
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

  resetLogin() {
    this.mds.setAuthData();
    this.router.navigate(['/']);
  }
}
