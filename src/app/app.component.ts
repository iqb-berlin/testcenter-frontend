import { MainDataService } from './maindata.service';
import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import { BackendService } from './backend.service';
import {CustomtextService} from 'iqb-components';
import {Subscription} from 'rxjs';
import {AppError} from './app.interfaces';

@Component({
  selector: 'tc-root',
  templateUrl: './app.component.html'
})


export class AppComponent implements OnInit, OnDestroy {
  private appErrorSubscription: Subscription = null;
  showError = false;
  errorData: AppError;

  constructor (
    public mds: MainDataService,
    private bs: BackendService,
    private cts: CustomtextService,
    @Inject('API_VERSION_EXPECTED') private readonly expectedApiVersion: string,
  ) { }

  private static isValidVersion(expectedVersion: string, reportedVersion: string): boolean {
    if (expectedVersion) {
      const searchPattern = /\d+/g;
      const expectedVersionNumbers = expectedVersion.match(searchPattern);
      if (expectedVersionNumbers) {
        if (reportedVersion) {
          const reportedVersionNumbers = reportedVersion.match(searchPattern);
          if (reportedVersionNumbers) {
            if (reportedVersionNumbers[0] !== expectedVersionNumbers[0]) {
              return false;
            } else if (expectedVersionNumbers.length > 1) {
              if ((reportedVersionNumbers.length < 2) || +reportedVersionNumbers[1] < +expectedVersionNumbers[1]) {
                return false;
              } else if ((expectedVersionNumbers.length > 2) && reportedVersionNumbers[1] === expectedVersionNumbers[1]) {
                if ((reportedVersionNumbers.length < 3) || +reportedVersionNumbers[2] < +expectedVersionNumbers[2]) {
                  return false;
                }
              }
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    return true;
  }

  closeErrorBox() {
    this.showError = false;
  }

  ngOnInit() {
    setTimeout(() => {
      this.mds.appConfig.setDefaultCustomTexts();

      this.appErrorSubscription = this.mds.appError$.subscribe(err => {
        if (err && !this.mds.errorReportingSilent) {
          this.errorData = err;
          this.showError = true;
        }
      });

      window.addEventListener('message', (event: MessageEvent) => {
        const msgData = event.data;
        const msgType = msgData['type'];
        if ((msgType !== undefined) && (msgType !== null)) {
          if (msgType.substr(0, 2) === 'vo') {
            this.mds.postMessage$.next(event);
          }
        }
      });

      this.setupFocusListeners();

      this.bs.getSysConfig().subscribe(sc => {
        if (sc) {
          this.cts.addCustomTexts(sc.customTexts);
          const authData = MainDataService.getAuthData();
          if (authData) {
            this.cts.addCustomTexts(authData.customTexts);
          }
          this.mds.isApiValid = AppComponent.isValidVersion(this.expectedApiVersion, sc.version);
          if (!this.mds.isApiValid) {
            this.mds.appError$.next({
              label: 'Server-Problem: API-Version ungültig',
              description: 'erwartet: ' + this.expectedApiVersion + ', gefunden: ' + sc.version,
              category: 'FATAL'
            });
          }
          if (sc.mainLogo) {
            console.warn('SysConfig.mainLogo not implemented yet');
          }
          this.mds.setTestConfig(sc.testConfig);
        } else {
          this.mds.isApiValid = false;
        }
      });

      this.bs.getSysCheckInfo().subscribe(myConfigs => {
        this.mds.sysCheckAvailable = !!myConfigs;
      });
    });
  }

  private setupFocusListeners() {
    let hidden = '';
    let visibilityChange = '';
    if (typeof document.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
      hidden = 'hidden';
      visibilityChange = 'visibilitychange';
      // @ts-ignore
    } else if (typeof document['msHidden'] !== 'undefined') {
      hidden = 'msHidden';
      visibilityChange = 'msvisibilitychange';
      // @ts-ignore
    } else if (typeof document['mozHidden'] !== 'undefined') {
      hidden = 'mozHidden';
      visibilityChange = 'mozHidden';
      // @ts-ignore
    } else if (typeof document['webkitHidden'] !== 'undefined') {
      hidden = 'webkitHidden';
      visibilityChange = 'webkitvisibilitychange';
    }
    if (hidden && visibilityChange) {
      document.addEventListener(visibilityChange, () => {
        this.mds.appWindowHasFocus$.next(!document[hidden])
      }, false);
    }
    window.addEventListener('blur', () => {
      this.mds.appWindowHasFocus$.next(document.hasFocus())
    });
    window.addEventListener('focus', () => {
      this.mds.appWindowHasFocus$.next(document.hasFocus())
    });
    window.addEventListener('unload', () => {
      this.mds.appWindowHasFocus$.next(!document[hidden])
    });
  }

  ngOnDestroy() {
    if (this.appErrorSubscription !== null) {
      this.appErrorSubscription.unsubscribe();
    }
  }
}
