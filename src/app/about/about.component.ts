import { Component, Inject, OnInit } from '@angular/core';
import { LogindataService } from '../logindata.service';

@Component({
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  constructor(
    @Inject('APP_NAME') private appName: string,
    @Inject('APP_PUBLISHER') private appPublisher: string,
    @Inject('APP_VERSION') private appVersion: string,
    private lds: LogindataService
  ) { }

  ngOnInit() {
    this.lds.pageTitle$.next('IQB-Testcenter - Impressum/Datenschutz');
  }
}
