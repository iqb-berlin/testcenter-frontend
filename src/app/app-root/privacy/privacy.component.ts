import { Component, Inject } from '@angular/core';
import { MainDataService } from '../../maindata.service';

@Component({
  templateUrl: './privacy.component.html',
  styles: [
    'mat-card {margin: 10px}'
  ]
})
export class PrivacyComponent {
  constructor(
    @Inject('APP_NAME') public appName: string,
    @Inject('APP_PUBLISHER') public appPublisher: string,
    @Inject('APP_VERSION') public appVersion: string,
    @Inject('VERONA_API_VERSION_SUPPORTED') public veronaApiVersionSupported: string,
    @Inject('IS_PRODUCTION_MODE') public isProductionMode: boolean,
    public mds: MainDataService
  ) { }
}
