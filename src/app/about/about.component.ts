import { Component, Inject } from '@angular/core';

@Component({
  templateUrl: './about.component.html'
})
export class AboutComponent {

  constructor(
    @Inject('APP_NAME') private appName: string,
    @Inject('APP_PUBLISHER') private appPublisher: string,
    @Inject('APP_VERSION') private appVersion: string
  ) { }
}
