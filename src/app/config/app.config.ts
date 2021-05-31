import { CustomtextService } from 'iqb-components';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import customTextsDefault from './custom-texts.json';
import { KeyValuePairs } from '../app.interfaces';

export interface SysConfig {
  customTexts: KeyValuePairs;
  version: string;
  mainLogo: string;
  testConfig: KeyValuePairs;
  serverTimestamp: number;
  broadcastingService: BroadCastingServiceInfo;
  appConfig: Map<string, string>;
}

export interface BroadCastingServiceInfo {
  status: string;
  version?: string;
  versionExpected?: string;
}

export const localStorageTestConfigKey = 'iqb-tc-c';

export class AppConfig {
  customTexts: KeyValuePairs = {};
  detectedApiVersion = '';
  mainLogo = 'assets/IQB-LogoA.png';
  testConfig: KeyValuePairs = {};
  serverTimestamp = 0;
  broadcastingService: BroadCastingServiceInfo = { status: 'none' };
  app_title = 'IQB-Testcenter';
  background_body: string;
  background_box: string;
  intro_html = 'Einführungstext nicht definiert';
  trusted_intro_html: SafeUrl = null;
  impressum_html = 'Impressum/Datenschutz nicht definiert';
  trusted_impressum_html: SafeUrl = null;
  global_warning = '';
  global_warning_expired_day = '';
  global_warning_expired_hour = '';
  isValidApiVersion = false;
  sanitizer: DomSanitizer = null;
  cts: CustomtextService = null;

  constructor(
    sysConfig: SysConfig,
    cts: CustomtextService,
    expectedApiVersion: string,
    sanitizer: DomSanitizer
  ) {
    this.sanitizer = sanitizer;
    this.cts = cts;
    if (sysConfig) {
      this.setCustomTexts(sysConfig.customTexts);
      this.setAppConfig(sysConfig.appConfig);
      this.testConfig = sysConfig.testConfig;
      this.serverTimestamp = sysConfig.serverTimestamp;
      if (sysConfig.broadcastingService && sysConfig.broadcastingService.status) {
        this.broadcastingService = sysConfig.broadcastingService;
      }
      this.detectedApiVersion = sysConfig.version;
    } else {
      this.setCustomTexts(null);
      this.setAppConfig(null);
    }
    this.isValidApiVersion = AppConfig.checkApiVersion(this.detectedApiVersion, expectedApiVersion);
    if (this.testConfig) {
      localStorage.setItem(localStorageTestConfigKey, JSON.stringify(this.testConfig));
    } else {
      localStorage.removeItem(localStorageTestConfigKey);
    }
    this.applyBackgroundColors();
  }

  setCustomTexts(customTexts: KeyValuePairs): void {
    const ctSettings = {};
    Object.keys(customTextsDefault).forEach(k => {
      ctSettings[k] = customTextsDefault[k].defaultvalue;
    });
    if (customTexts) {
      Object.keys(customTexts).forEach(k => {
        ctSettings[k] = customTexts[k];
      });
    }
    this.cts.addCustomTexts(ctSettings);
  }

  setAppConfig(appConfig: Map<string, string>): void {
    this.app_title = this.cts.getCustomText('app_title');
    if (!this.app_title) this.app_title = 'IQB-Testcenter';
    this.intro_html = this.cts.getCustomText('app_intro1');
    if (this.intro_html) {
      this.impressum_html = this.intro_html;
    } else {
      this.intro_html = 'Einführungstext nicht definiert';
      this.impressum_html = 'Impressum/Datenschutz nicht definiert';
    }
    this.mainLogo = 'assets/IQB-LogoA.png';
    this.background_body = '';
    this.background_box = '';
    this.trusted_intro_html = null;
    this.trusted_impressum_html = null;
    this.global_warning = '';
    this.global_warning_expired_day = '';
    this.global_warning_expired_hour = '';
    if (appConfig) {
      Object.keys(appConfig).forEach(k => {
        switch (k) {
          case 'app_title':
            this.app_title = appConfig[k];
            break;
          case 'mainLogo':
            this.mainLogo = appConfig[k];
            break;
          case 'background_body':
            this.background_body = appConfig[k];
            break;
          case 'background_box':
            this.background_box = appConfig[k];
            break;
          case 'intro_html':
            this.intro_html = appConfig[k];
            break;
          case 'impressum_html':
            this.impressum_html = appConfig[k];
            break;
          case 'global_warning':
            this.global_warning = appConfig[k];
            break;
          case 'global_warning_expired_day':
            this.global_warning_expired_day = appConfig[k];
            break;
          case 'global_warning_expired_hour':
            this.global_warning_expired_hour = appConfig[k];
            break;
          default:
            console.warn(`unknown key in appConfig "${k}"`);
        }
      });
    }
    this.trusted_intro_html = this.sanitizer.bypassSecurityTrustHtml(this.intro_html);
    this.trusted_impressum_html = this.sanitizer.bypassSecurityTrustHtml(this.impressum_html);
  }

  applyBackgroundColors(): void {
    document.documentElement.style.setProperty('--tc-body-background', this.background_body);
    document.documentElement.style.setProperty('--tc-box-background', this.background_box);
  }

  private static checkApiVersion(versionToCheck: string, expectedVersion: string): boolean {
    if (!expectedVersion || !versionToCheck) {
      return false;
    }
    const searchPattern = /\d+/g;
    const expectedVersionNumbers = expectedVersion.match(searchPattern);
    const reportedVersionNumbers = versionToCheck.match(searchPattern);
    if (expectedVersionNumbers && reportedVersionNumbers) {
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
      return true;
    }
    return false;
  }

  static isWarningExpired(warningDay: string, warningHour: string): boolean {
    const calcTimePoint = new Date(warningDay);
    calcTimePoint.setHours(calcTimePoint.getHours() + Number(warningHour));
    const now = new Date(Date.now());
    return calcTimePoint < now;
  }

  getWarningMessage(): string {
    if (this.global_warning_expired_day) {
      return AppConfig.isWarningExpired(this.global_warning_expired_day, this.global_warning_expired_hour) ?
        this.global_warning : '';
    }
    return this.global_warning;
  }

  getAppConfig(): Map<string, string> {
    const appConfig = new Map<string, string>();
    appConfig.set('app_title', this.app_title);
    appConfig.set('mainLogo', this.mainLogo);
    appConfig.set('background_body', this.background_body);
    appConfig.set('background_box', this.background_box);
    appConfig.set('intro_html', this.intro_html);
    appConfig.set('impressum_html', this.impressum_html);
    appConfig.set('global_warning', this.global_warning);
    appConfig.set('global_warning_expired_day', this.global_warning_expired_day);
    appConfig.set('global_warning_expired_hour', this.global_warning_expired_hour);
    return appConfig;
  }
}
