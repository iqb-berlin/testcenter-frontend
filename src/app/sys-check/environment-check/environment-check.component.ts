import { Component, OnInit } from '@angular/core';
import { SyscheckDataService } from '../syscheck-data.service';
import {ReportEntry} from '../backend.service';

@Component({
  selector: 'iqb-environment-check',
  templateUrl: './environment-check.component.html'
})
export class EnvironmentCheckComponent implements OnInit {

  private report: Map<string, ReportEntry> = new Map<string, ReportEntry>();

  constructor(
    private ds: SyscheckDataService
  ) { }

  ngOnInit() {

    this.getBrowser(); // fallback if UAParser does not work
    this.getOS(); // fallback if UAParser does not work

    this.getResolution();
    this.getFromUAParser();
    this.getFromNavigator();
    this.getBrowserPlugins();

    const report = Array.from(this.report.values())
      .sort((item1: ReportEntry, item2: ReportEntry) => (item1.label > item2.label) ? 1 : -1);

    this.ds.environmentData$.next(Object.values(report));
  }

  private reportPush(key: string, value: string) {

    this.report.set(key, {'id': '0', 'type': 'environment', 'label': key, 'value': value});
  }

  getBrowser() {

    const userAgent = window.navigator.userAgent;
    // tslint:disable-next-line:max-line-length
    const regex = /(MSIE|Trident|(?!Gecko.+)Firefox|(?!AppleWebKit.+Chrome.+)Safari(?!.+Edge)|(?!AppleWebKit.+)Chrome(?!.+Edge)|(?!AppleWebKit.+Chrome.+Safari.+)Edge|AppleWebKit(?!.+Chrome|.+Safari)|Gecko(?!.+Firefox))(?: |\/)([\d\.apre]+)/;
    // credit due to: https://gist.github.com/ticky/3909462#gistcomment-2245669
    const deviceInfoSplits = regex.exec(userAgent);
    const helperRegex = /[^.]*/;
    const browserInfo = helperRegex.exec(deviceInfoSplits[0]);
    const browserInfoSplits = browserInfo[0].split('/');
    this.reportPush('Browser', browserInfoSplits[0]);
    this.reportPush('Browser-Version', browserInfoSplits[1]);
  }

  getFromUAParser() {

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
        this.reportPush(item[2], uaInfos[item[0]][item[1]]);
      }
    });
  }

  getFromNavigator() {

    [
      ['hardwareConcurrency', 'CPU-Kerne'],
      ['cookieEnabled', 'Browser-Cookies aktiviert'],
      ['language', 'Browser-Sprache']
    ].forEach((item: string[]) => {
      if (typeof navigator[item[0]] !== 'undefined') {
        this.reportPush(item[1], navigator[item[0]]);
      }
    });
  }

  getBrowserPlugins() {

    if ((typeof navigator.plugins === 'undefined') || (!navigator.plugins.length)) {
      return;
    }
    const pluginNames = Array<String>();
    for (let i = 0; i < navigator.plugins.length; i++) {
      pluginNames.push(navigator.plugins[i].name);
    }
    this.reportPush('Browser-Plugins:', pluginNames.join(', '));
  }

  getOS() {

    const userAgent = window.navigator.userAgent;
    let osName = '';
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
    this.reportPush('Betriebsystem', osName);
  }

  getResolution() {

    this.reportPush('Bildschirm-Auflösung', window.screen.width + ' x ' + window.screen.height);
    const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.offsetWidth;
    const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.offsetHeight;
    this.reportPush('Fenster-Größe', windowWidth + ' x ' + windowHeight);
  }

}
