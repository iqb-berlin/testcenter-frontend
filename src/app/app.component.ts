import { TestControllerService } from './test-controller';
import { LogindataService } from './logindata.service';
import { merge } from 'rxjs';

// import { TestdataService } from './test-controller';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})


export class AppComponent implements OnInit {
  public title = '';

  constructor (
    private lds: LogindataService,
    private tcs: TestControllerService,
    private router: Router) { }

  ngOnInit() {

    merge(
      this.lds.pageTitle$,
      this.tcs.pageTitle$).subscribe(t => {
        this.title = t;
      });

    this.lds.pageTitle$.subscribe(t => {
      this.title = t;
    });

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
