import {RunModeKey} from "./test-controller.interfaces";
import {BookletConfig} from "../config/booklet-config";


export class TestConfig extends BookletConfig {
  // default for RunModeKey.DEMO
  canReview = false;
  saveResponses = false;
  forceTimeRestrictions = false;
  forceNaviRestrictions = false;
  presetCode = true;
  showTimeLeft = true;
  modeLabel = "Demo";

  constructor(loginMode: RunModeKey = RunModeKey.DEMO) {
    super();
    if (loginMode !== RunModeKey.DEMO) {
      switch (loginMode) {
        case RunModeKey.HOT_RESTART:
        case RunModeKey.HOT_RETURN:
          this.canReview = false;
          this.saveResponses = true;
          this.forceTimeRestrictions = true;
          this.forceNaviRestrictions = true;
          this.presetCode = false;
          this.showTimeLeft = false;
          this.modeLabel = "Durchführung Test/Befragung";
          break;
        case RunModeKey.REVIEW:
          this.canReview = true;
          this.saveResponses = false;
          this.forceTimeRestrictions = false;
          this.forceNaviRestrictions = false;
          this.presetCode = true;
          this.showTimeLeft = true;
          this.modeLabel = "Prüfdurchgang ohne Speichern";
          break;
        case RunModeKey.TRIAL:
          this.canReview = true;
          this.saveResponses = true;
          this.forceTimeRestrictions = true;
          this.forceNaviRestrictions = true;
          this.presetCode = true;
          this.showTimeLeft = false;
          this.modeLabel = "Prüfdurchgang mit Speichern";
          break;
        default:
          console.error("TestConfig: invalid test mode '" + loginMode + "'")
      }
    }
  }
}
