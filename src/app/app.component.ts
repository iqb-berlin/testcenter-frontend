import { LogindataService } from './logindata.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})


export class AppComponent implements OnInit {

  constructor (
    private lds: LogindataService
  ) { }

  ngOnInit() {
    // give a message to the central message broadcast
    window.addEventListener('message', (event: MessageEvent) => {
      const msgData = event.data;
      const msgType = msgData['type'];
      if ((msgType !== undefined) && (msgType !== null)) {
        if (msgType.substr(0, 7) === 'OpenCBA') {
          this.lds.postMessage$.next(event);
        }
      }
    });
  }
}
