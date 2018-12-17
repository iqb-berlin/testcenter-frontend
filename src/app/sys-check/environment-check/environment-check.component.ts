import { Component, OnInit } from '@angular/core';
import { SyscheckDataService } from '../syscheck-data.service';

@Component({
  selector: 'iqb-environment-check',
  templateUrl: './environment-check.component.html',
  styleUrls: ['./environment-check.component.css']
})
export class EnvironmentCheckComponent implements OnInit {
  screenSize: any;
  deviceInfo: any;
  regex: any;
  helperRegex: any;
  isExisting: Array<string>;
  result: Array<string>;
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
  }

  goto() {
    this.ds.questionnaireAvailable$.next(true);
  }

  removeSysInfo() {
    this.screenSize = "";
    this.result = [];
  }
}
