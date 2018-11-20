import { MainDatastoreService } from './../admin/maindatastore.service';
import { Component, Inject, OnInit } from '@angular/core';
import { BackendService } from './../backend.service';

@Component({
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {
  myAboutText : string;
  constructor(
    @Inject('APP_NAME') private appName: string,
    @Inject('APP_PUBLISHER') private appPublisher: string,
    @Inject('APP_VERSION') private appVersion: string,
    private mds: MainDatastoreService,
    private bs: BackendService
  ) { }

  ngOnInit() {
    this.mds.pageTitle$.next('');
    this.bs.getAboutText().subscribe(t => this.myAboutText = t as string);
  }

  
}
