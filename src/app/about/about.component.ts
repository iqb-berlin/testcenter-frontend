import { MainDataService } from 'src/app/maindata.service';
import { Component, Inject } from '@angular/core';
import {Router} from "@angular/router";
import {CustomtextService} from "iqb-components";

@Component({
  templateUrl: './about.component.html'
})
export class AboutComponent {

  constructor(
    @Inject('APP_NAME') public appName: string,
    @Inject('APP_PUBLISHER') public appPublisher: string,
    @Inject('APP_VERSION') public appVersion: string,
    private router: Router,
    public mds: MainDataService,
    private cts: CustomtextService
  ) { }

  goBack() {
    this.router.navigate(['/']);
  }
}
