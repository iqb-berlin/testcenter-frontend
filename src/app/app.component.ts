import { LogindataService } from './logindata.service';
import { merge } from 'rxjs';

// import { TestdataService } from './test-controller';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tc-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})


export class AppComponent implements OnInit {
  public title = '';

  constructor (
    private lds: LogindataService,
    private router: Router) { }

  ngOnInit() {
    this.lds.pageTitle$.subscribe(t => {
      this.title = t;
    });
    // merge(
    //   this.gss.pageTitle$,
    //   this.tss.pageTitle$).subscribe(t => {
    //     this.title = t;
    //   });

    // window.addEventListener('message', (event) => {
    //   this.lds.processMessagePost(event);
    // }, false);
  }
}
