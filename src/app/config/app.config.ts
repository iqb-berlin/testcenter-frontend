import { CustomtextService } from 'iqb-components';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import customTextsDefault from './custom-texts.json';
import { KeyValuePairs } from '../app.interfaces';

export interface AppSettings {
  app_title: string,
  mainLogo: string,
  background_body: string,
  background_box: string,
  intro_html: string,
  impressum_html: string,
  global_warning: string,
  global_warning_expired_day: string,
  global_warning_expired_hour: string
}

export interface SysConfig {
  customTexts: KeyValuePairs;
  version: string;
  mainLogo: string;
  testConfig: KeyValuePairs;
  serverTimestamp: number;
  broadcastingService: BroadCastingServiceInfo;
  appConfig: AppSettings;
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

  get warningMessage(): string {
    if (this.global_warning_expired_day) {
      return AppConfig.isWarningExpired(this.global_warning_expired_day, this.global_warning_expired_hour) ?
        '' : this.global_warning;
    }
    return this.global_warning;
  }

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

  setAppConfig(appConfig: AppSettings): void {
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
    const elementStyle = window.getComputedStyle(document.body);
    this.background_body = elementStyle.getPropertyValue('--tc-body-background');
    this.background_box = elementStyle.getPropertyValue('--tc-box-background');
    this.trusted_intro_html = null;
    this.trusted_impressum_html = null;
    this.global_warning = '';
    this.global_warning_expired_day = '';
    this.global_warning_expired_hour = '';
    if (appConfig) {
      if (appConfig.app_title) this.app_title = appConfig.app_title;
      if (appConfig.mainLogo) this.mainLogo = appConfig.mainLogo;
      if (appConfig.background_body) this.background_body = appConfig.background_body;
      if (appConfig.background_box) this.background_box = appConfig.background_box;
      if (appConfig.intro_html) this.intro_html = appConfig.intro_html;
      if (appConfig.impressum_html) this.impressum_html = appConfig.impressum_html;
      if (appConfig.global_warning) this.global_warning = appConfig.global_warning;
      if (appConfig.global_warning_expired_day) this.global_warning_expired_day = appConfig.global_warning_expired_day;
      if (appConfig.global_warning_expired_hour) {
        this.global_warning_expired_hour = appConfig.global_warning_expired_hour;
      }
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
    calcTimePoint.setHours(Number(warningHour));
    const now = new Date(Date.now());
    return calcTimePoint < now;
  }

  getAppConfig(): AppSettings {
    return {
      app_title: this.app_title,
      mainLogo: this.mainLogo,
      background_body: this.background_body,
      background_box: this.background_box,
      intro_html: this.intro_html,
      impressum_html: this.impressum_html,
      global_warning: this.global_warning,
      global_warning_expired_day: this.global_warning_expired_day,
      global_warning_expired_hour: this.global_warning_expired_hour
    };
  }
}
