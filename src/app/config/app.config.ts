import { CustomtextService } from 'iqb-components';
import customTextsDefault from './custom-texts.json';
import { KeyValuePairs } from '../app.interfaces';

export interface SysConfig {
  customTexts: KeyValuePairs;
  version: string;
  mainLogo: string;
  testConfig: KeyValuePairs;
}

export class AppConfig {
  constructor(
    private cts: CustomtextService
  ) {
  }

  setDefaultCustomTexts() {
    const ctDefaults = {};
    for (const k of Object.keys(customTextsDefault)) {
      ctDefaults[k] = customTextsDefault[k].defaultvalue
    }
    this.cts.addCustomTexts(ctDefaults);
  }
}
