import { ReportEntry } from './../syscheck-data.service';
import { Component, OnInit } from '@angular/core';
import { SyscheckDataService } from '../syscheck-data.service';


@Component({
  selector: 'iqb-environment-check',
  templateUrl: './environment-check.component.html',
  styleUrls: ['./environment-check.component.css']
})
export class EnvironmentCheckComponent implements OnInit {
  screenSizeText = 'bitte warten';
  osName = 'bitte warten';
  browserVersion = 'bitte warten';


  constructor(
    private ds: SyscheckDataService
  ) { }

  ngOnInit() {
    const deviceInfo = window.navigator.userAgent;


    // browser + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
    // tslint:disable-next-line:max-line-length
    const regex = /(MSIE|Trident|(?!Gecko.+)Firefox|(?!AppleWebKit.+Chrome.+)Safari(?!.+Edge)|(?!AppleWebKit.+)Chrome(?!.+Edge)|(?!AppleWebKit.+Chrome.+Safari.+)Edge|AppleWebKit(?!.+Chrome|.+Safari)|Gecko(?!.+Firefox))(?: |\/)([\d\.apre]+)/;
    // credit due to: https://gist.github.com/ticky/3909462#gistcomment-2245669
    const deviceInfoSplits = regex.exec(deviceInfo);
    const helperRegex = /[^.]*/;
    const browserInfo = helperRegex.exec(deviceInfoSplits[0]);
    const browserInfoSplits = browserInfo[0].split('/');
    this.browserVersion = browserInfoSplits[0] + ' Version ' + browserInfoSplits[1];


    // os + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
    if (deviceInfo.indexOf('Windows') !== -1) {
      if (deviceInfo.indexOf('Windows NT 10.0') !== -1) {
        this.osName = 'Windows 10';
      } else if (deviceInfo.indexOf('Windows NT 6.2') !== -1) {
        this.osName = 'Windows 8';
      } else if (deviceInfo.indexOf('Windows NT 6.1') !== -1) {
        this.osName = 'Windows 7';
      } else if (deviceInfo.indexOf('Windows NT 6.0') !== -1) {
        this.osName = 'Windows Vista';
      } else if (deviceInfo.indexOf('Windows NT 5.1') !== -1) {
        this.osName = 'Windows XP';
      } else if (deviceInfo.indexOf('Windows NT 5.0') !== -1) {
        this.osName = 'Windows 2000';
      } else {
        this.osName = 'Windows, unbekannte Version';
      }
    } else if (deviceInfo.indexOf('Mac') !== -1) {
      this.osName = 'Mac/iOS';
    } else if (deviceInfo.indexOf('X11') !== -1) {
      this.osName = 'UNIX';
    } else if (deviceInfo.indexOf('Linux') !== -1) {
      this.osName = 'Linux';
    } else {
      this.osName = window.navigator.platform;
    }

    // screensize + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
    this.screenSizeText = 'Bildschirmgröße ist ' + window.screen.width + ' x ' + window.screen.height;


    // + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +
    // + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + +


    const myReport: ReportEntry[] = [];
    myReport.push({'label': 'Betriebssystem', 'value': this.osName});
    myReport.push({'label': 'Browser', 'value': this.browserVersion});
    myReport.push({'label': 'Bildschirm', 'value': this.screenSizeText});

    this.ds.environmentData$.next(myReport);
  }
}
