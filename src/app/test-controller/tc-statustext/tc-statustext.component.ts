import { LogindataService } from './../../logindata.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tc-statustext',
  styleUrls: ['./tc-statustext.component.css'],
  templateUrl: './tc-statustext.component.html'
})
export class TcStatustextComponent implements OnInit {
  private statustext = '';

  constructor(
    private lds: LogindataService
  ) {
    this.lds.globalErrorMsg$.subscribe(t => this.statustext = t);
  }

  ngOnInit() {
  }

}
