// @ts-ignore
import customTextsDefault from './custom-texts.json';
import {CustomtextService} from "iqb-components";

export class AppConfig  {
  constructor(
    private cts: CustomtextService
  ) {
  }

  resetCustomTexts() {
    this.cts.addCustomTextsFromDefs(customTextsDefault);
  }
}
