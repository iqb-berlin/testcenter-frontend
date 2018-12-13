import { SyscheckDataService } from './../syscheck-data.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'iqb-unit-check',
  templateUrl: './unit-check.component.html',
  styleUrls: ['./unit-check.component.css']
})
export class UnitCheckComponent implements OnInit {
  unitcheckEnabled = false;

  constructor(
    private ds: SyscheckDataService
  ) {
  }

  ngOnInit() {
    this.ds.unitcheckEnabled$.subscribe(is => this.unitcheckEnabled = is);
  }

}
