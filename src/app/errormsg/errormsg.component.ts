import { ServerError } from './../backend.service';
import { LogindataService } from './../logindata.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-errormsg',
  templateUrl: './errormsg.component.html',
  styleUrls: ['./errormsg.component.css']
})
export class ErrormsgComponent implements OnInit {
  private errorMsg: ServerError = null;

  constructor(
    private lds: LogindataService
  ) { }

  ngOnInit() {
    this.lds.globalErrorMsg$.subscribe(m => this.errorMsg = m);
  }

}
