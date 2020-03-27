import { Component, Inject } from '@angular/core';
import { CustomtextService } from 'iqb-components';

@Component({
  templateUrl: './about.component.html',
  styles: ['mat-card {background-color: lightgray;}']
})
export class AboutComponent {

  constructor(
    @Inject('APP_NAME') public appName: string,
    @Inject('APP_PUBLISHER') public appPublisher: string,
    @Inject('APP_VERSION') public appVersion: string,
    public cts: CustomtextService
  ) { }

}
