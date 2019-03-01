import { MainDataService } from './maindata.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tc-root',
  template: `<router-outlet></router-outlet>`,
  styleUrls: ['./app.component.scss']
})


export class AppComponent implements OnInit {

  constructor (
    private mds: MainDataService
  ) { }

  ngOnInit() {
    // give a message to the central message broadcast
    window.addEventListener('message', (event: MessageEvent) => {
      const msgData = event.data;
      const msgType = msgData['type'];
      if ((msgType !== undefined) && (msgType !== null)) {
        if (msgType.substr(0, 7) === 'OpenCBA') {
          this.mds.postMessage$.next(event);
        }
      }
    });
    this.mds.loadLoginStatus();
  }
}
