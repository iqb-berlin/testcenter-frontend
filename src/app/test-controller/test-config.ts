// @ts-ignore
import testConfigDefinition from '../config/test-config.json';
import {RunModeKey} from "./test-controller.interfaces";

export class TestConfig  {
  definition = testConfigDefinition;
  loading_mode: "LAZY" | "EAGER" = testConfigDefinition.loading_mode.defaultvalue;
  log_mode: "OFF" | "LEAN" | "RICH" = testConfigDefinition.log_mode.defaultvalue;
  page_navibuttons: "OFF" | "MERGED" | "SEPARATE_TOP" | "SEPARATE_BOTTOM" = testConfigDefinition.page_navibuttons.defaultvalue;
  unit_navibuttons: "OFF" | "ARROWS_ONLY" | "FULL" = testConfigDefinition.unit_navibuttons.defaultvalue;
  unit_menu: "OFF" | "ENABLED_ONLY" | "FULL" = testConfigDefinition.unit_menu.defaultvalue;
  force_presentation_complete: "ON" | "OFF" = testConfigDefinition.force_presentation_complete.defaultvalue;
  force_responses_complete: "OFF" | "SOME" | "COMPLETE" | "COMPLETE_AND_VALID" = testConfigDefinition.force_responses_complete.defaultvalue;

  // default for RunModeKey.DEMO
  canReview = false;
  saveResponses = false;
  forceTimeRestrictions = false;
  forceNaviRestrictions = false;
  presetCode = true;
  showTimeLeft = true;
  modeLabel = "Demo";

  constructor(loginMode: RunModeKey = RunModeKey.DEMO) {
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

  public setFromKeyValuePairs(config) {
    if (config) {
      if (config['loading_mode']) { this.loading_mode = config['loading_mode']}
      if (config['log_mode']) { this.log_mode = config['log_mode']}
      if (config['page_navibuttons']) { this.page_navibuttons = config['page_navibuttons']}
      if (config['unit_navibuttons']) { this.unit_navibuttons = config['unit_navibuttons']}
      if (config['unit_menu']) { this.unit_menu = config['unit_menu']}
      if (config['force_presentation_complete']) { this.force_presentation_complete = config['force_presentation_complete']}
      if (config['force_responses_complete']) { this.force_responses_complete = config['force_responses_complete']}
    }
  }

  public setFromXml(bookletConfigElement: Element) {
    if (bookletConfigElement) {
      const bookletConfigs = TestConfig.getChildElements(bookletConfigElement);
      for (let childIndex = 0; childIndex < bookletConfigs.length; childIndex++) {
        const configParameter = bookletConfigs[childIndex].getAttribute('parameter');

        switch (bookletConfigs[childIndex].nodeName) {
          // ----------------------
          case 'NavPolicy':
            if (configParameter) {
              if (configParameter.toUpperCase() === 'NextOnlyIfPresentationComplete'.toUpperCase()) {
                this.force_presentation_complete = "ON"
              }
            }
            break;
          case 'NavButtons':
            if (configParameter) {
              switch (configParameter.toUpperCase()) {
                case 'ON':
                  this.unit_navibuttons = "FULL";
                  break;
                case 'OFF':
                  this.unit_navibuttons = "OFF";
                  break;
                case 'ARROWSONLY':
                  this.unit_navibuttons = "ARROWS_ONLY";
                  break;
              }
            }
            break;
          case 'PageNavBar':
            if (configParameter) {
              if (configParameter.toUpperCase() === 'OFF') {
                this.page_navibuttons = "OFF"
              }
            }
            break;
          case 'Logging':
            if (configParameter) {
              if (configParameter.toUpperCase() === 'OFF') {
                this.log_mode = "OFF"
              }
            }
            break;
          case 'Loading':
            if (configParameter) {
              if (configParameter.toUpperCase() === 'EAGER') {
                this.loading_mode = "EAGER"
              }
            }
            break;
        }
      }
    }
  }

  private static getChildElements(element) {
    return Array.prototype.slice.call(element.childNodes)
      .filter(function (e) { return e.nodeType === 1; });
  }
}
