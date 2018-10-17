import { MainDatastoreService } from './../admin/maindatastore.service';
import { Component, Inject, OnInit } from '@angular/core';

@Component({
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  constructor(
    @Inject('APP_NAME') private appName: string,
    @Inject('APP_PUBLISHER') private appPublisher: string,
    @Inject('APP_VERSION') private appVersion: string,
    private mds: MainDatastoreService
  ) { }

  ngOnInit() {
    this.mds.pageTitle$.next('');
  }
}
