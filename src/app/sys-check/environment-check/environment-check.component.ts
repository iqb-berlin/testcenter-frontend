import { ReportEntry } from './../syscheck-data.service';
import { Component, OnInit } from '@angular/core';
import { SyscheckDataService } from '../syscheck-data.service';
import { GeneratedFile } from '@angular/compiler';


@Component({
  selector: 'iqb-environment-check',
  templateUrl: './environment-check.component.html',
  styleUrls: ['./environment-check.component.css']
})
export class EnvironmentCheckComponent implements OnInit {
  environmentRating: EnvironmentRating;
  screenSize: any;
  deviceInfo: any;
  osName: any = 'Unknown';
  regex: any;
  helperRegex: any;
  isExisting: Array<string>;
  result: Array<string>;


  discoveredEnvData: EnvironmentData = {
    'osName': '',
    'browserName': '',
    'browserVersion': '',
    'resolution': {
      height: -1,
      width: -1
    }
  };
  discoveredEnvRating: EnvironmentRating = {
    OSRating: 'N/A',
    ResolutionRating: 'N/A',
    BrowserRating: 'N/A'
  };

  constructor(
    private ds: SyscheckDataService
  ) { }

  ngOnInit() {
    this.deviceInfo = window.navigator.userAgent;
    // tslint:disable-next-line:max-line-length
    this.regex = /(MSIE|Trident|(?!Gecko.+)Firefox|(?!AppleWebKit.+Chrome.+)Safari(?!.+Edge)|(?!AppleWebKit.+)Chrome(?!.+Edge)|(?!AppleWebKit.+Chrome.+Safari.+)Edge|AppleWebKit(?!.+Chrome|.+Safari)|Gecko(?!.+Firefox))(?: |\/)([\d\.apre]+)/;
    // credit due to: https://gist.github.com/ticky/3909462#gistcomment-2245669
    this.helperRegex = /[^.]*/;
    this.isExisting = this.regex.exec(this.deviceInfo);
    this.isExisting = this.helperRegex.exec(this.isExisting[0]);
    this.result = this.isExisting[0].split('/');
    this.screenSize = 'Screen size is ' + window.screen.width + ' pixels by ' + window.screen.height + ' pixels';
    this.osName = window.navigator.platform;


    this.discoveredEnvData = {
      osName: this.getOSVersion(),
      browserName: this.result[0],
      browserVersion: this.result[1],
      resolution: {
        height: window.screen.height,
        width: window.screen.width
      }
    };

    this.discoveredEnvRating = this.calculateEnvironmentRating(this.discoveredEnvData);

    // dummy: transform to label-value-pairs!
    const myReport: ReportEntry[] = [];
    myReport.push({'label': 'lalala', 'value': 'sososo'});

    this.ds.environmentData$.next(myReport);

  }

  getOSVersion() {
    if (window.navigator.userAgent.indexOf('Windows') !== -1) {
      if (window.navigator.userAgent.indexOf('Windows NT 10.0') !== -1) {
        this.osName = 'Windows 10';
      }
      if (window.navigator.userAgent.indexOf('Windows NT 6.2') !== -1) {
        this.osName = 'Windows 8';
      }
      if (window.navigator.userAgent.indexOf('Windows NT 6.1') !== -1) {
        this.osName = 'Windows 7';
      }
      if (window.navigator.userAgent.indexOf('Windows NT 6.0') !== -1) {
        this.osName = 'Windows Vista';
      }
      if (window.navigator.userAgent.indexOf('Windows NT 5.1') !== -1) {
        this.osName = 'Windows XP';
      }
      if (window.navigator.userAgent.indexOf('Windows NT 5.0') !== -1) {
        this.osName = 'Windows 2000';
      }
    }
    if (window.navigator.userAgent.indexOf('Mac') !== -1) {
      this.osName = 'Mac/iOS';
    }
    if (window.navigator.userAgent.indexOf('X11') !== -1) {
      this.osName = 'UNIX';
    }
    if (window.navigator.userAgent.indexOf('Linux') !== -1) {
      this.osName = 'Linux';
    }
    return this.osName;
  }

  goto() {
    this.ds.questionnaireAvailable$.next(true);
  }

  // // // //
  public calculateEnvironmentRating(ed: EnvironmentData): EnvironmentRating  {
    const ratings: EnvironmentRating = {
      OSRating: 'N/A',
      ResolutionRating: 'N/A',
      BrowserRating: 'N/A'
    };

    if (ed.osName === 'Windows 7' || ed.osName === 'Windows 10' || ed.osName === 'Windows 8' || ed.osName === 'Mac/iOS') {
      ratings.OSRating = 'Good';
    } else if (ed.osName === 'Windows Vista' || ed.osName === 'Linux' || ed.osName === 'UNIX') {
      ratings.OSRating = 'Possibly compatible';
    } else {
      ratings.OSRating = 'Not compatible';
    }

    if (ed.browserName.indexOf('Chrome') || ed.browserName.indexOf('Mozilla')) {
      if (parseInt(ed.browserVersion, 10) >= 60) {
        ratings.BrowserRating = 'Good';
      } else {
        ratings.BrowserRating = 'Not compatible';
      }
    }

    if (ed.resolution.width >= 1024 && ed.resolution.height >= 768) {
      ratings.ResolutionRating = 'Good';
    } else {
      ratings.ResolutionRating =  'Not compatible';
    }
    return ratings;
  }
}

export interface EnvironmentData {
  osName: string;
  // osVersion: string;
  browserName: string;
  browserVersion: string;
  resolution: {
    height: number;
    width: number;
  };
}

export interface EnvironmentRating {
  OSRating: 'N/A' | 'Good'| 'Not compatible' | 'Possibly compatible';
  ResolutionRating: 'N/A' | 'Good'| 'Not compatible' | 'Possibly compatible';
  BrowserRating: 'N/A' | 'Good'| 'Not compatible' | 'Possibly compatible';
}
