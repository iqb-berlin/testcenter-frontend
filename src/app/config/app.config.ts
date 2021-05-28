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
  app_title: string;
  background_body: string;
  background_box: string;
  intro_html: string;
  impressum_html: string;
  global_warning: string;
  global_warning_expired_day: Date;
  global_warning_expired_hour: number;
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
  global_warning_expired_day: Date;
  global_warning_expired_hour: number;
  isValidApiVersion = false;

  constructor(
    sysConfig: SysConfig,
    cts: CustomtextService,
    expectedApiVersion: string,
    sanitizer: DomSanitizer
  ) {
    const ctSettings = {};
    Object.keys(customTextsDefault).forEach(k => {
      ctSettings[k] = customTextsDefault[k].defaultvalue;
      if (k === 'app_title') this.app_title = customTextsDefault[k].defaultvalue;
      if (k === 'app_intro1') {
        this.intro_html = customTextsDefault[k].defaultvalue;
        this.impressum_html = customTextsDefault[k].defaultvalue;
      }
    });
    if (sysConfig) {
      Object.keys(sysConfig.customTexts).forEach(k => {
        ctSettings[k] = sysConfig.customTexts[k];
        if (k === 'app_title') this.app_title = sysConfig.customTexts[k];
        if (k === 'app_intro1') {
          this.intro_html = sysConfig.customTexts[k];
          this.impressum_html = sysConfig.customTexts[k];
        }
      });
      if (sysConfig.app_title) this.app_title = sysConfig.app_title;
      if (sysConfig.mainLogo) this.mainLogo = sysConfig.mainLogo;
      if (sysConfig.background_body) {
        this.background_body = sysConfig.background_body;
        document.documentElement.style.setProperty('--tc-body-background', this.background_body);
      }
      if (sysConfig.background_box) {
        this.background_box = sysConfig.background_box;
        document.documentElement.style.setProperty('--tc-box-background', this.background_box);
      }
      this.isValidApiVersion = AppConfig.checkApiVersion(sysConfig.version, expectedApiVersion);
      this.detectedApiVersion = sysConfig.version;
      if (sysConfig.intro_html) this.intro_html = sysConfig.intro_html;
      if (sysConfig.impressum_html) this.impressum_html = sysConfig.impressum_html;
      this.global_warning = sysConfig.global_warning;
      this.global_warning_expired_day = sysConfig.global_warning_expired_day;
      this.global_warning_expired_hour = sysConfig.global_warning_expired_hour;
      this.testConfig = sysConfig.testConfig;
      this.serverTimestamp = sysConfig.serverTimestamp;
      if (sysConfig.broadcastingService && sysConfig.broadcastingService.status) {
        this.broadcastingService = sysConfig.broadcastingService;
      }
    }
    cts.addCustomTexts(ctSettings);
    this.trusted_intro_html = sanitizer.bypassSecurityTrustHtml(this.intro_html);
    this.trusted_impressum_html = sanitizer.bypassSecurityTrustHtml(this.impressum_html);
    if (this.testConfig) {
      localStorage.setItem(localStorageTestConfigKey, JSON.stringify(this.testConfig));
    } else {
      localStorage.removeItem(localStorageTestConfigKey);
    }
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
}
