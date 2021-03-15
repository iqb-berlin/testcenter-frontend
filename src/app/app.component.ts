import {
  Component, Inject, OnDestroy, OnInit
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CustomtextService } from 'iqb-components';
import { MainDataService } from './maindata.service';
import { BackendService } from './backend.service';
import { AppError } from './app.interfaces';

@Component({
  selector: 'tc-root',
  templateUrl: './app.component.html'
})

export class AppComponent implements OnInit, OnDestroy {
  private appErrorSubscription: Subscription = null;

  showError = false;

  errorData: AppError;

  constructor(
    public mds: MainDataService,
    private bs: BackendService,
    private cts: CustomtextService,
    @Inject('API_VERSION_EXPECTED') private readonly expectedApiVersion: string
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
            }
            if (expectedVersionNumbers.length > 1) {
              if ((reportedVersionNumbers.length < 2) || +reportedVersionNumbers[1] < +expectedVersionNumbers[1]) {
                return false;
              }
              if ((expectedVersionNumbers.length > 2) && reportedVersionNumbers[1] === expectedVersionNumbers[1]) {
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

  closeErrorBox(): void {
    this.showError = false;
  }

  ngOnInit(): void {
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
        const msgType = msgData.type;
        if ((msgType !== undefined) && (msgType !== null)) {
          if (msgType.substr(0, 2) === 'vo') {
            this.mds.postMessage$.next(event);
          }
        }
      });

      this.setupFocusListeners();

      this.bs.getSysConfig().subscribe(sysConfig => {
        if (sysConfig) {
          this.cts.addCustomTexts(sysConfig.customTexts);
          const authData = MainDataService.getAuthData();
          if (authData) {
            this.cts.addCustomTexts(authData.customTexts);
          }

          if (sysConfig.broadcastingService && sysConfig.broadcastingService.status) {
            this.mds.broadcastingServiceInfo = sysConfig.broadcastingService;
          }
          this.mds.isApiValid = AppComponent.isValidVersion(this.expectedApiVersion, sysConfig.version);
          this.mds.apiVersion = sysConfig.version;

          if (!this.mds.isApiValid) {
            this.mds.appError$.next({
              label: 'Server-Problem: API-Version ungültig',
              description: `erwartet: ${this.expectedApiVersion}, gefunden: ${sysConfig.version}`,
              category: 'FATAL'
            });
          }

          // TODO implement SysConfig.mainLogo

          this.mds.setTestConfig(sysConfig.testConfig);
        } else {
          this.mds.isApiValid = false;
        }
      });

      this.bs.getSysCheckInfo().subscribe(sysCheckConfigs => {
        this.mds.sysCheckAvailable = !!sysCheckConfigs;
      });
    });
  }

  private setupFocusListeners() {
    let hidden = '';
    let visibilityChange = '';
    if (typeof document.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
      hidden = 'hidden';
      visibilityChange = 'visibilitychange';
      // eslint-disable-next-line @typescript-eslint/dot-notation
    } else if (typeof document['msHidden'] !== 'undefined') {
      hidden = 'msHidden';
      visibilityChange = 'msvisibilitychange';
      // eslint-disable-next-line @typescript-eslint/dot-notation
    } else if (typeof document['mozHidden'] !== 'undefined') {
      hidden = 'mozHidden';
      visibilityChange = 'mozHidden';
      // eslint-disable-next-line @typescript-eslint/dot-notation
    } else if (typeof document['webkitHidden'] !== 'undefined') {
      hidden = 'webkitHidden';
      visibilityChange = 'webkitvisibilitychange';
    }
    if (hidden && visibilityChange) {
      document.addEventListener(visibilityChange, () => {
        this.mds.appWindowHasFocus$.next(!document[hidden]);
      }, false);
    }
    window.addEventListener('blur', () => {
      this.mds.appWindowHasFocus$.next(document.hasFocus());
    });
    window.addEventListener('focus', () => {
      this.mds.appWindowHasFocus$.next(document.hasFocus());
    });
    window.addEventListener('unload', () => {
      this.mds.appWindowHasFocus$.next(!document[hidden]);
    });
  }

  ngOnDestroy(): void {
    if (this.appErrorSubscription !== null) {
      this.appErrorSubscription.unsubscribe();
    }
  }
}
