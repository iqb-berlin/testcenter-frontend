import { ReportEntry } from '../backend.service';
import { Component, OnInit } from '@angular/core';
import { SyscheckDataService } from '../syscheck-data.service';

@Component({
  selector: 'iqb-environment-check',
  templateUrl: './environment-check.component.html'
})
export class EnvironmentCheckComponent implements OnInit {
  screenSizeText = 'bitte warten';
  osName = 'bitte warten';
  browser = 'bitte warten';
  browserVersion = '';
  browserName = '';


  constructor(
    private ds: SyscheckDataService
  ) { }

  ngOnInit() {

    this.getBrowser();
    this.getOS();
    this.getResolution();

    const myReport: ReportEntry[] = [];
    myReport.push({'id': '0', 'type': 'environment', 'label': 'Betriebssystem', 'value': this.osName});
    myReport.push({'id': '0', 'type': 'environment', 'label': 'Browser Name', 'value': this.browserName});
    myReport.push({'id': '0', 'type': 'environment', 'label': 'Browser Version', 'value': this.browserVersion});
    myReport.push({'id': '0', 'type': 'environment', 'label': 'Bildschirm-Auflösung', 'value': this.screenSizeText});

    this.ds.environmentData$.next(myReport);
  }

  getBrowser() {

    const userAgent = window.navigator.userAgent;
    console.log(userAgent);
    // tslint:disable-next-line:max-line-length
    const regex = /(MSIE|Trident|(?!Gecko.+)Firefox|(?!AppleWebKit.+Chrome.+)Safari(?!.+Edge)|(?!AppleWebKit.+)Chrome(?!.+Edge)|(?!AppleWebKit.+Chrome.+Safari.+)Edge|AppleWebKit(?!.+Chrome|.+Safari)|Gecko(?!.+Firefox))(?: |\/)([\d\.apre]+)/;
    // credit due to: https://gist.github.com/ticky/3909462#gistcomment-2245669
    const deviceInfoSplits = regex.exec(userAgent);
    const helperRegex = /[^.]*/;
    const browserInfo = helperRegex.exec(deviceInfoSplits[0]);
    const browserInfoSplits = browserInfo[0].split('/');
    this.browserVersion = browserInfoSplits[1];
    this.browserName = browserInfoSplits[0];
    this.browser = this.browserName + ' Version ' + this.browserVersion;
  }

  getOS() {

    const userAgent = window.navigator.userAgent;
    if (userAgent.indexOf('Windows') !== -1) {
      if (userAgent.indexOf('Windows NT 10.0') !== -1) {
        this.osName = 'Windows 10';
      } else if (userAgent.indexOf('Windows NT 6.2') !== -1) {
        this.osName = 'Windows 8';
      } else if (userAgent.indexOf('Windows NT 6.1') !== -1) {
        this.osName = 'Windows 7';
      } else if (userAgent.indexOf('Windows NT 6.0') !== -1) {
        this.osName = 'Windows Vista';
      } else if (userAgent.indexOf('Windows NT 5.1') !== -1) {
        this.osName = 'Windows XP';
      } else if (userAgent.indexOf('Windows NT 5.0') !== -1) {
        this.osName = 'Windows 2000';
      } else {
        this.osName = 'Windows, unbekannte Version';
      }
    } else if (userAgent.indexOf('Mac') !== -1) {
      this.osName = 'Mac/iOS';
    } else if (userAgent.indexOf('Linux') !== -1) {
      this.osName = 'Linux';
    } else {
      this.osName = window.navigator.platform;
    }
  }

  getResolution() {

    this.screenSizeText = window.screen.width + ' x ' + window.screen.height;
  }

}
