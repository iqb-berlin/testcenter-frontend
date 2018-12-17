import { SyscheckDataService, ReportEntry } from './../syscheck-data.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'iqb-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
  reportEnabled = false;
  environmentData: ReportEntry[] = [];
  networkData: ReportEntry[] = [];
  questionnaireData: ReportEntry[] = [];

  constructor(
    private ds: SyscheckDataService
  ) {
  }

  ngOnInit() {
    // this.ds.environmentData$.subscribe(rd => ); too early!
    this.ds.networkData$.subscribe(rd => {
      this.networkData = rd;
      this.environmentData = this.ds.environmentData$.getValue();
    });
    this.ds.questionnaireData$.subscribe(rd => this.questionnaireData = rd);

    this.ds.reportEnabled$.subscribe(is => this.reportEnabled = is);
  }
}
