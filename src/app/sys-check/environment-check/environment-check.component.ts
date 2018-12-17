import { Component, OnInit } from '@angular/core';
import { SyscheckDataService, EnvironmentRating, EnvironmentData } from '../syscheck-data.service';
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
  osName: any = "Unknown";
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
    this.regex = /(MSIE|Trident|(?!Gecko.+)Firefox|(?!AppleWebKit.+Chrome.+)Safari(?!.+Edge)|(?!AppleWebKit.+)Chrome(?!.+Edge)|(?!AppleWebKit.+Chrome.+Safari.+)Edge|AppleWebKit(?!.+Chrome|.+Safari)|Gecko(?!.+Firefox))(?: |\/)([\d\.apre]+)/;
    this.helperRegex = /[^.]*/;
    this.isExisting = this.regex.exec(this.deviceInfo);
    this.isExisting = this.helperRegex.exec(this.isExisting[0]);
    this.result = this.isExisting[0].split("/");
    this.screenSize = "Screen size is " + window.screen.width + " pixels by " + window.screen.height + " pixels";  
    this.osName = window.navigator.platform;


    
    this.discoveredEnvData = {
      osName: this.getOSVersion(),
      browserName: this.result[0],
      browserVersion: this.result[1],
      resolution: {
        height: window.screen.height,
        width: window.screen.width
      }
    }

    this.discoveredEnvRating = this.ds.calculateEnvironmentRating(this.discoveredEnvData);

    this.ds.environmentData$.next(this.discoveredEnvData);

  }

  getOSVersion() {
    if (window.navigator.userAgent.indexOf("Windows")!= -1) {
      if (window.navigator.userAgent.indexOf("Windows NT 10.0")!= -1) this.osName="Windows 10";
      if (window.navigator.userAgent.indexOf("Windows NT 6.2") != -1) this.osName="Windows 8";
      if (window.navigator.userAgent.indexOf("Windows NT 6.1") != -1) this.osName="Windows 7";
      if (window.navigator.userAgent.indexOf("Windows NT 6.0") != -1) this.osName="Windows Vista";
      if (window.navigator.userAgent.indexOf("Windows NT 5.1") != -1) this.osName="Windows XP";
      if (window.navigator.userAgent.indexOf("Windows NT 5.0") != -1) this.osName="Windows 2000";
    }
    if (window.navigator.userAgent.indexOf("Mac")            != -1) this.osName="Mac/iOS";
    if (window.navigator.userAgent.indexOf("X11")            != -1) this.osName="UNIX";
    if (window.navigator.userAgent.indexOf("Linux")          != -1) this.osName="Linux";
    return this.osName;
  }

  goto() {
    this.ds.questionnaireAvailable$.next(true);
  }
}
