import { Component, OnInit } from '@angular/core';
import { SysCheckDataService } from '../sys-check-data.service';
import { ReportEntry } from '../sys-check.interfaces';
import {CustomtextService} from "iqb-components";

@Component({
  styleUrls: ['../sys-check.component.css'],
  templateUrl: './welcome.component.html'
})
export class WelcomeComponent implements OnInit {

  private report: Map<string, ReportEntry> = new Map<string, ReportEntry>();

  private rating = {
    browser: {
      'Chrome': 79,
      'Safari': 13,
      'Edge': 79,
      'Firefox': 72,
      'Internet Explorer': 11,
      'Opera': 64
    },
    screen: {
      width: 800,
      height: 600
    }
  };

  constructor(
    public ds: SysCheckDataService
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.ds.setNewCurrentStep('w');
      this.getBrowser(); // fallback if UAParser does not work
      this.setOS(); // fallback if UAParser does not work
      this.setScreenData();
      this.getFromUAParser();
      this.setNavigatorInfo();
      this.setBrowserPluginInfo();
      this.rateBrowser();

      const report = Array.from(this.report.values())
        .sort((item1: ReportEntry, item2: ReportEntry) => (item1.label > item2.label) ? 1 : -1);
      this.ds.environmentReport = Object.values(report);
    })
  }

  private getBrowser() {
    const userAgent = window.navigator.userAgent;
    const regex = /(MSIE|Trident|(?!Gecko.+)Firefox|(?!AppleWebKit.+Chrome.+)Safari(?!.+Edge)|(?!AppleWebKit.+)Chrome(?!.+Edge)|(?!AppleWebKit.+Chrome.+Safari.+)Edge|AppleWebKit(?!.+Chrome|.+Safari)|Gecko(?!.+Firefox))(?: |\/)([\d\.apre]+)/;
    // credit due to: https://gist.github.com/ticky/3909462#gistcomment-2245669
    const deviceInfoSplits = regex.exec(userAgent);
    const helperRegex = /[^.]*/;
    const browserInfo = helperRegex.exec(deviceInfoSplits[0]);
    const browserInfoSplits = browserInfo[0].split('/');
    this.report.set('Browser', {'id': 'browser', 'type': 'environment', 'label': 'Browser', 'value': browserInfoSplits[0], 'warning': false});
    this.report.set('Browser-Version', {'id': 'browser-version', 'type': 'environment', 'label': 'Browser-Version', 'value': browserInfoSplits[1], 'warning': false});
  }

  private getFromUAParser() {
    if (typeof window['UAParser'] === 'undefined') {
      return;
    }
    const uaInfos = window['UAParser']();
    [
      ['cpu', 'architecture', 'CPU-Architektur'],
      ['device', 'model', 'Gerätemodell'],
      ['device', 'type', 'Gerätetyp'],
      ['device', 'vendor', 'Gerätehersteller'],
      ['browser', 'name', 'Browser'],
      ['browser', 'major', 'Browser-Version'],
      ['os', 'name', 'Betriebsystem'],
      ['os', 'version', 'Betriebsystem-Version']
    ].forEach((item: Array<string>) => {
      if ((typeof uaInfos[item[0]] !== 'undefined') && (typeof uaInfos[item[0]][item[1]] !== 'undefined')) {
        this.report.set(item[2], {'id': item[2], 'type': 'environment', 'label': item[2], 'value': uaInfos[item[0]][item[1]], 'warning': false});
      }
    });
  }

  private rateBrowser() {
    const browser = this.report.get('Browser').value;
    const browserVersion = this.report.get('Browser-Version').value;
    if ((typeof this.rating.browser[browser] !== 'undefined') && (browserVersion < this.rating.browser[browser])) {
      this.report.get('Browser-Version').warning = true;
    }
    if (browser === 'Internet Explorer') {
      this.report.get('Browser').warning = true;
    }
  }

  private setNavigatorInfo() {
    [
      ['hardwareConcurrency', 'CPU-Kerne'],
      ['cookieEnabled', 'Browser-Cookies aktiviert'],
      ['language', 'Browser-Sprache']
    ].forEach((item: string[]) => {
      if (typeof navigator[item[0]] !== 'undefined') {
        this.report.set(item[1], {'id': item[0], 'type': 'environment', 'label': item[1], 'value': navigator[item[0]], 'warning': false});
      }
    });
  }

  private setBrowserPluginInfo() {
    if ((typeof navigator.plugins === 'undefined') || (!navigator.plugins.length)) {
      return;
    }
    const pluginNames = Array<String>();
    for (let i = 0; i < navigator.plugins.length; i++) {
      pluginNames.push(navigator.plugins[i].name);
    }
    this.report.set('Browser-Plugins', {'id': 'browser-plugins', 'type': 'environment', 'label': 'Browser-Plugins', 'value': pluginNames.join(', '), 'warning': false});
  }

  private setOS() {
    const userAgent = window.navigator.userAgent;
    let osName;
    if (userAgent.indexOf('Windows') !== -1) {
      if (userAgent.indexOf('Windows NT 10.0') !== -1) {
        osName = 'Windows 10';
      } else if (userAgent.indexOf('Windows NT 6.2') !== -1) {
        osName = 'Windows 8';
      } else if (userAgent.indexOf('Windows NT 6.1') !== -1) {
        osName = 'Windows 7';
      } else if (userAgent.indexOf('Windows NT 6.0') !== -1) {
        osName = 'Windows Vista';
      } else if (userAgent.indexOf('Windows NT 5.1') !== -1) {
        osName = 'Windows XP';
      } else if (userAgent.indexOf('Windows NT 5.0') !== -1) {
        osName = 'Windows 2000';
      } else {
        osName = 'Windows, unbekannte Version';
      }
    } else if (userAgent.indexOf('Mac') !== -1) {
      osName = 'Mac/iOS';
    } else if (userAgent.indexOf('Linux') !== -1) {
      osName = 'Linux';
    } else {
      osName = window.navigator.platform;
    }
    this.report.set('Betriebsystem', {'id': 'os', 'type': 'environment', 'label': 'Betriebsystem', 'value': osName, 'warning': false});
  }

  private setScreenData() {
    const isLargeEnough = (window.screen.width >= this.rating.screen.width) && (window.screen.height >= this.rating.screen.height);
    this.report.set('Bildschirm-Auflösung', {'id': 'screen-resolution', 'type': 'environment', 'label': 'Bildschirm-Auflösung', 'value': window.screen.width + ' x ' + window.screen.height, 'warning': !isLargeEnough});
    const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.offsetWidth;
    const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.offsetHeight;
    this.report.set('Fenster-Größe', {'id': 'screen-size', 'type': 'environment', 'label': 'Fenster-Größe', 'value': windowWidth + ' x ' + windowHeight, 'warning': false});
  }
}
