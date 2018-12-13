import { Component, OnInit } from '@angular/core';
import { SyscheckDataService } from '../syscheck-data.service';

@Component({
  selector: 'iqb-environment-check',
  templateUrl: './environment-check.component.html',
  styleUrls: ['./environment-check.component.css']
})
export class EnvironmentCheckComponent implements OnInit {

  constructor(
    private ds: SyscheckDataService
  ) { }

  ngOnInit() {
  }

  goto() {
    this.ds.questionnaireAvailable$.next(true);
  }
}
