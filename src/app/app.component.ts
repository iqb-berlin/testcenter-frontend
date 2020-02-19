import { MainDataService } from './maindata.service';
import { Component, OnInit } from '@angular/core';
import { BackendService } from './backend.service';
import { LoginData } from './app.interfaces';
import {CustomtextService, ServerError} from 'iqb-components';
import {appconfig} from "./app.config";

@Component({
  selector: 'tc-root',
  template: `<router-outlet></router-outlet>`,
  styleUrls: ['./app.component.scss']
})


export class AppComponent implements OnInit {

  constructor (
    private mds: MainDataService,
    private bs: BackendService,
    private cts: CustomtextService
  ) { }

  ngOnInit() {
    this.mds.setCustomtextsFromDefList(appconfig.customtextsApp);
    this.mds.setCustomtextsFromDefList(appconfig.customtextsLogin);
    this.mds.setCustomtextsFromDefList(appconfig.customtextsBooklet);

    // give a message to the central message broadcast

    window.addEventListener('message', (event: MessageEvent) => {
      const msgData = event.data;
      const msgType = msgData['type'];
      if ((msgType !== undefined) && (msgType !== null)) {
        if (msgType.substr(0, 3) === 'vo.') {
          this.mds.postMessage$.next(event);
        }
      }
    });

    this.bs.getSysConfig().subscribe(sc => {
      this.mds.setDefaultCustomtexts(sc);
      this.mds.setCustomtextsFromDefList(appconfig.customtextsApp);
      // restore login status if stored in localStorage
      const loginToken = localStorage.getItem('lt');
      if (loginToken !== null) {
        if (loginToken.length > 0) {
          let personToken = localStorage.getItem('pt');
          let bookletDbId = 0;
          if (personToken !== null) {
            if (personToken.length > 0) {
              const bookletDbIdStr = localStorage.getItem('bi');
              if (bookletDbIdStr !== null) {
                bookletDbId = Number(bookletDbIdStr);
              }
            }
          } else {
            personToken = '';
          }
          let code = localStorage.getItem('c');
          if (code === null) {
            code = '';
          }

          // bookletDbId is not yet checked by getLoginData, only passed-through
          this.bs.getLoginData(loginToken, personToken, bookletDbId).subscribe(ld => {
            if (ld instanceof ServerError) {
              this.mds.setNewLoginData();
            } else {
              const loginData = ld as LoginData;
              loginData.logintoken = loginToken;
              loginData.persontoken = personToken;
              if (personToken.length === 0) {
                loginData.code = code;
                loginData.booklet = 0;
              }
              this.mds.setNewLoginData(loginData);
              if (loginData.customTexts) {
                this.cts.addCustomTexts(loginData.customTexts);
              }
            }
          });
        } else {
          this.mds.setNewLoginData();
          this.mds.setCustomtextsFromDefList(appconfig.customtextsLogin);
          this.mds.setCustomtextsFromDefList(appconfig.customtextsBooklet);
        }
      } else {
        this.mds.setNewLoginData();
        this.mds.setCustomtextsFromDefList(appconfig.customtextsLogin);
        this.mds.setCustomtextsFromDefList(appconfig.customtextsBooklet);
      }
    });
  }
}
