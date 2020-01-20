import {BackendService, ReportEntry} from '../backend.service';
import { SyscheckDataService } from '../syscheck-data.service';
import {Component, Input, OnInit} from '@angular/core';
import {SaveReportComponent} from './save-report/save-report.component';
import {MatDialog, MatSnackBar} from '@angular/material';

@Component({
  selector: 'iqb-report',
  templateUrl: './report.component.html'
})
export class ReportComponent implements OnInit {

  @Input() canSave: boolean;

  // reportEnabled = false;
  environmentData: ReportEntry[] = [];
  networkData: ReportEntry[] = [];
  questionnaireData: ReportEntry[] = [];

  constructor(
    private bs: BackendService,
    private ds: SyscheckDataService,
    private saveDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.ds.environmentData$.subscribe(rd => {this.environmentData = rd; });
    this.ds.networkData$.subscribe(rd => {this.networkData = rd; });
    this.ds.questionnaireData$.subscribe(rd => this.questionnaireData = rd);
    console.log('subscriptions done');
  }

  ngOnInit() {


    // this.ds.reportEnabled$.subscribe(is => this.reportEnabled = is);
  }

  saveReport() {
    const dialogRef = this.saveDialog.open(SaveReportComponent, {
      width: '500px',
      height: '600px',
      data: 'jojo'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result !== false) {
        const reportKey = result.get('key').value as string;
        const reportTitle = result.get('title').value as string;
        const cd = this.ds.checkConfig$.getValue();
        this.bs.saveReport(cd.id, reportKey, reportTitle,
          this.ds.environmentData$.getValue(),
          this.ds.networkData$.getValue(),
          this.ds.questionnaireData$.getValue()
        ).subscribe((saveOK: boolean) => {
          if (saveOK) {
            this.snackBar.open('Bericht gespeichert.', '', {duration: 3000});
          } else {
            this.snackBar.open('Konnte Bericht nicht speichern.', '', {duration: 3000});
          }
        });
      }
    });
  }

}
