import { TestdataService } from './../test-controller';
import { MessageDialogComponent, MessageDialogData, MessageType } from './../iqb-common';
import { MatDialog } from '@angular/material';
import { BackendService, BookletData, GetBookletsResponseData, GetBookletResponseData } from './../shared/backend.service';
import { Router } from '@angular/router';
import { GlobalStoreService } from './../shared/global-store.service';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent implements OnInit {

  codeinputform: FormGroup;
  public showCodeinput: boolean;
  public showTeststartButtons: boolean;
  public select_message: string;
  private sessiondata: GetBookletsResponseData;
  private testlist: StartButtonData[];
  private code = '';
  private isError = false;
  private errorMessage = '';


  constructor(private fb: FormBuilder,
    private gss: GlobalStoreService,
    private tss: TestdataService,
    public messsageDialog: MatDialog,
    private router: Router,
    private bs: BackendService) {
      this.showCodeinput = false;
      this.showTeststartButtons = true;
      this.select_message = 'Bitte warten.';
      this.testlist = [];
    }

  ngOnInit() {
    this.gss.updatePageTitle('IQB-Testcenter - Start');

    this.codeinputform = this.fb.group({
      code: this.fb.control('', [Validators.required, Validators.minLength(1)])
    });

    this.bs.getSessions(this.gss.loginToken).subscribe(
      (bdata: GetBookletsResponseData) => {
        this.sessiondata = bdata;

        if (Object.keys(this.sessiondata.booklets).length > 1) {
          this.showCodeinput = true;
          this.showTeststartButtons = false;
        } else {
          this.setTestselectButtons();
        }
      }, (errormsg: string) => {
        this.isError = true;
        this.select_message = errormsg;
      }
    );
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  codeinput() {
    this.isError = false;
    this.errorMessage = '';
    if (this.setTestselectButtons()) {
      this.showCodeinput = false;
      this.showTeststartButtons = true;
    }
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  setTestselectButtons(): boolean {
    let codeIsValid = true;
    this.testlist = [];
    if (Object.keys(this.sessiondata.booklets).length > 1) {
      this.code = this.codeinputform.get('code').value;
      codeIsValid = Object.keys(this.sessiondata.booklets).includes(this.code);
    } else {
      this.code = Object.keys(this.sessiondata.booklets)[0];
    }

    if (codeIsValid) {
      const myBooklets = <BookletData[]>this.sessiondata.booklets[this.code];
      for (const booklet of myBooklets) {
        const myTest = new StartButtonData(booklet.name, booklet.title, booklet.filename);
        this.testlist.push(myTest);
        myTest.loadStatus(this.bs, this.gss, this.code);
      }

      if (this.testlist.length === 1) {
        this.select_message = 'Bitte klicken Sie auf den Schalter unten, um den Test zu starten!';
      } else {
        this.select_message = 'Bitte klicken Sie auf einen der Schalter unten, um den Test auszuwählen und zu starten!';
      }
      if (this.sessiondata.mode === 'trial') {
        this.select_message += ' Achtung: Dieser Test wird im Modus "trial" durchgeführt, d. h. es gelten keine ';
        this.select_message += 'Zeitbeschränkungen, aber die Navigation ist so beschränkt wie im normalen Test.';
      } else if (this.sessiondata.mode === 'review') {
        this.select_message += ' Achtung: Dieser Test wird im Modus "review" durchgeführt, d. h. es gelten keine ';
        this.select_message += 'Zeitbeschränkungen und die Navigation ist nicht beschränkt.';
        this.select_message += ' Nutzen Sie das Menü oben rechts, um Kommentare zu vergeben!';
      }
    } else {

      this.messsageDialog.open(MessageDialogComponent, {
        width: '400px',
        data: <MessageDialogData>{
          title: 'Eingabe Kennwort für Test',
          content: 'Für dieses Kennwort wurde kein Test gefunden.',
          type: MessageType.error
        }
      });
    }

    return codeIsValid;
  }

  buttonStartTest(event) {
    let myElement = event.target;
    do {
      if (myElement.localName !== 'button') {
        myElement = myElement.parentElement;
      }
    } while (myElement.localName !== 'button');

    const ButtonDataSplits = myElement.value.split('##');

    this.isError = false;
    this.errorMessage = '';
    this.bs.startSession(this.gss.loginToken, this.code, ButtonDataSplits[0]).subscribe(
      (sessiontoken: string) => {
        this.tss.updateSessionToken(sessiontoken);
        this.tss.gotoFirstUnit(ButtonDataSplits[1]);
      }, (errormsg: string) => {
        this.tss.updateSessionToken('');
        this.isError = true;
        this.errorMessage = errormsg;
      }
    );
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
  filename_and_lastUnit: string;

  constructor(name: string, title: string, filename: string) {
    this.name = name;
    this.title = title;
    this.filename = filename;
    this.isEnabled = false;
    this.statustxt = 'Bitte warten';
  }

  loadStatus(bs: BackendService, gss: GlobalStoreService, code: string) {
    bs.getBookletStatus(gss.loginToken, code, this.name).subscribe((respData: GetBookletResponseData) => {
      this.statustxt = respData.statusLabel;
      this.isEnabled = respData.canStart;
      this.filename_and_lastUnit = this.filename + '##' + respData.lastUnit;
    });
  }
}
