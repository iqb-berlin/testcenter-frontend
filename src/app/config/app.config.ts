import { CustomtextService } from 'iqb-components';
import customTextsDefault from './custom-texts.json';
import { KeyValuePairs } from '../app.interfaces';

export interface SysConfig {
  customTexts: KeyValuePairs;
  version: string;
  mainLogo: string;
  testConfig: KeyValuePairs;
  serverTimestamp: number;
}

export class AppConfig {
  constructor(
    private cts: CustomtextService
  ) {
  }

  setDefaultCustomTexts(): void {
    const ctDefaults = {};
    Object.keys(customTextsDefault).forEach(key => {
      ctDefaults[key] = customTextsDefault[key].defaultvalue;
    });
    this.cts.addCustomTexts(ctDefaults);
  }
}
