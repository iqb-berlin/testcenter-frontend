import { KeyValuePair } from './test-controller/test-controller.interfaces';
import { ServerError, BackendService } from './backend.service';
import { BehaviorSubject, Subject, forkJoin } from 'rxjs';
import { Injectable } from '@angular/core';
import { LoginData } from './app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class MainDataService {
  private static defaultLoginData: LoginData = {
    logintoken: '',
    persontoken: '',
    mode: '',
    groupname: '',
    loginname: '',
    workspaceName: '',
    booklets: null,
    code: '',
    booklet: 0,
    bookletlabel: '',
    costumTexts: {}
  };
  private static defaultCostumTexts: KeyValuePair = {
    'app_title': 'IQB-Testcenter',
    'login_testEndButtonText': 'Test beenden',
    'login_bookletSelectPrompt': 'Bitte wählen!',
    'login_bookletSelectTitle': 'Bitte wählen!',
    'login_bookletSelectPromptOne': 'Bitte klicke auf die Schaltfläche auf der linken Seite, um den Test zu starten!',
    'login_bookletSelectPromptMany': 'Bitte klicke auf eine der Schaltflächen auf der linken Seite, um einen Test zu starten!',
    'login_codeInputPrompt': 'Bitte Log-in eingeben, der auf dem Zettel steht!',
    'login_codeInputTitle': 'Log-in eingeben',
    'booklet_msgPresentationNotCompleteTitleNext':
        'Weiterblättern nicht möglich!',
    'booklet_msgPresentationNotCompleteTextNext':
        'Du kannst erst weiterblättern, wenn Audio-Dateien vollständig abgespielt wurden '
        + 'und wenn du in allen Fenstern bis ganz nach unten gescrollt hast.',
    'booklet_msgPresentationNotCompleteTitlePrev':
        'Zurückblättern - Warnung',
    'booklet_msgPresentationNotCompleteTextPrev':
        'Eine Audio-Datei ist noch nicht bis zu Ende abgespielt oder Seiten wurden noch nicht vollständig gezeigt. '
        + 'Wenn du jetzt zurückblätterst, kannst Du später Audio-Dateien nicht nocheinmal starten.',
    'booklet_codeToEnterTitle': 'Freigabewort',
    'booklet_codeToEnterPrompt': 'Bitte gib das Freigabewort ein, das angesagt wurde!',
    'booklet_msgSoonTimeOver5Minutes': 'Du hast noch 5 Minuten Zeit für die Bearbeitung der Aufgaben in diesem Abschnitt.',
    'booklet_msgSoonTimeOver1Minute': 'Du hast noch 1 Minute Zeit für die Bearbeitung der Aufgaben in diesem Abschnitt.',
    'booklet_msgTimerStarted': 'Die Bearbeitungszeit für diesen Abschnitt hat begonnen: ',
    'booklet_msgTimerCancelled': 'Die Bearbeitung des Abschnittes wurde abgebrochen.',
    'booklet_msgTimeOver': 'Die Bearbeitung des Abschnittes ist beendet.',
    'booklet_warningLeaveTimerBlockTitle': 'Aufgabenabschnitt verlassen?',
    'booklet_warningLeaveTimerBlockPrompt': 'Wenn du jetzt weiterblätterst, beendest ' +
        'du vorzeitig die Bearbeitung dieses Aufgabenabschnitts und du kannst nicht mehr zurück.',
  };

  public loginData$ = new BehaviorSubject<LoginData>(MainDataService.defaultLoginData);
  public globalErrorMsg$ = new BehaviorSubject<ServerError>(null);
  public refreshCostumTexts = false;
  private _costumTextsApp: KeyValuePair = {};
  private _costumTextsLogin: KeyValuePair = {};

  // set by app.component.ts
  public postMessage$ = new Subject<MessageEvent>();

  constructor(private bs: BackendService) {}

  // ensures consistency
  setNewLoginData(logindata?: LoginData) {
    const myLoginData: LoginData = {
      logintoken: MainDataService.defaultLoginData.logintoken,
      persontoken: MainDataService.defaultLoginData.persontoken,
      mode: MainDataService.defaultLoginData.mode,
      groupname: MainDataService.defaultLoginData.groupname,
      loginname: MainDataService.defaultLoginData.loginname,
      workspaceName: MainDataService.defaultLoginData.workspaceName,
      booklets: MainDataService.defaultLoginData.booklets,
      code: MainDataService.defaultLoginData.code,
      booklet: MainDataService.defaultLoginData.booklet,
      bookletlabel: MainDataService.defaultLoginData.bookletlabel,
      costumTexts: MainDataService.defaultLoginData.costumTexts // always ignored except right after getting from backend!
    };

    if (logindata) {
      if (
        (logindata.logintoken.length > 0) &&
        (logindata.loginname.length > 0) &&
        (logindata.mode.length > 0) &&
        (logindata.groupname.length > 0) &&
        (logindata.workspaceName.length > 0) &&
        (logindata.booklets)) {

          const validCodes = Object.keys(logindata.booklets);
          if (validCodes.length > 0) {
            myLoginData.logintoken = logindata.logintoken;
            myLoginData.loginname = logindata.loginname;
            myLoginData.mode = logindata.mode;
            myLoginData.groupname = logindata.groupname;
            myLoginData.workspaceName = logindata.workspaceName;
            myLoginData.booklets = logindata.booklets;
            if (logindata.code.length > 0) {
              if (logindata.code in logindata.booklets) {
                myLoginData.code = logindata.code;
              }
            }
            if (logindata.persontoken.length > 0) {
              myLoginData.persontoken = logindata.persontoken;
              myLoginData.booklet = logindata.booklet;
              if (myLoginData.booklet > 0) {
                myLoginData.bookletlabel = logindata.bookletlabel;
              }
            }
          }
      }

    }
    this.loginData$.next(myLoginData);
    localStorage.setItem('lt', myLoginData.logintoken);
    localStorage.setItem('pt', myLoginData.persontoken);
    localStorage.setItem('bi', myLoginData.booklet.toString());
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  setCode ( newCode: string) {
    const myLoginData = this.loginData$.getValue();
    myLoginData.code = newCode;
    this.setNewLoginData(myLoginData);
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  setBookletDbId ( personToken: string, bId: number, bLabel: string) {
    const myLoginData = this.loginData$.getValue();
    myLoginData.persontoken = personToken;
    myLoginData.booklet = bId;
    myLoginData.bookletlabel = bLabel;
    this.setNewLoginData(myLoginData);
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  endBooklet () {
    const myLoginData = this.loginData$.getValue();
    if (myLoginData.booklet > 0 && myLoginData.mode === 'hot') {
      forkJoin(
        this.bs.addBookletLogClose(myLoginData.booklet),
        this.bs.lockBooklet(myLoginData.booklet)
      ).subscribe(ok => {
        myLoginData.booklet = 0;
        myLoginData.bookletlabel = '';
        this.setNewLoginData(myLoginData);
      });
    } else {
      myLoginData.booklet = 0;
      myLoginData.bookletlabel = '';
      this.setNewLoginData(myLoginData);
    }
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  getCode(): string {
    const myLoginData = this.loginData$.getValue();
    return myLoginData.code;
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  getBookletLabel(): string {
    const myLoginData = this.loginData$.getValue();
    return myLoginData.bookletlabel;
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  getPersonToken(): string {
    const myLoginData = this.loginData$.getValue();
    return myLoginData.persontoken;
  }

  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  setCostumTextsApp(sc: KeyValuePair = {}) {
    this.refreshCostumTexts = false;
    this._costumTextsApp = sc;
    this.refreshCostumTexts = true;
  }
  setCostumTextsLogin(sc: KeyValuePair = {}) {
    this.refreshCostumTexts = false;
    this._costumTextsLogin = sc;
    this.refreshCostumTexts = true;
  }
  getCostumText(key: string): string {
    if (this._costumTextsLogin) {
      if (this._costumTextsLogin.hasOwnProperty(key)) {
        return this._costumTextsLogin[key];
      }
    }
    if (this._costumTextsApp) {
      if (this._costumTextsApp.hasOwnProperty(key)) {
        return this._costumTextsApp[key];
      }
    }
    if (MainDataService.defaultCostumTexts.hasOwnProperty(key)) {
      return MainDataService.defaultCostumTexts[key];
    }
    return key;
  }
}
