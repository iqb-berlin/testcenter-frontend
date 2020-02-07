import {BackendService} from '../backend.service';
import { SyscheckDataService } from '../syscheck-data.service';
import {Component, Input} from '@angular/core';
import {SaveReportComponent} from './save-report/save-report.component';
import {MatDialog, MatSnackBar} from '@angular/material';
import {ReportEntry} from "../sys-check.interfaces";

@Component({
  selector: 'iqb-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent {

  @Input() canSave: boolean;

  environmentData: ReportEntry[] = [];
  networkData: ReportEntry[] = [];
  questionnaireData: ReportEntry[] = [];
  unitData: ReportEntry[] = [];

  csvReport = '';

  constructor(
    private bs: BackendService,
    private ds: SyscheckDataService,
    private saveDialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.ds.environmentData$.subscribe(rd => {this.environmentData = rd; });
    this.ds.networkData$.subscribe(rd => {this.networkData = rd; });
    this.ds.questionnaireData$.subscribe(rd => this.questionnaireData = rd);
    this.ds.unitData$.subscribe(rd => this.unitData = rd);
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
          this.ds.questionnaireData$.getValue(),
          this.ds.unitData$.getValue()
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

  exportReport() {

    const stripQuotes = (string: String) => (string.toString() || '').replace(/[\\"]/g, '\\"');

    this.csvReport = this.ds.environmentData$.getValue()
      .concat(this.ds.networkData$.getValue())
      .concat(this.ds.questionnaireData$.getValue())
      .concat(this.ds.unitData$.getValue())
      .map((e: ReportEntry) => '"' + stripQuotes(e.label) + '", "' + stripQuotes(e.value) + '"')
      .join('\n');
  }

  isReady() {
    return (typeof this.ds.task$.getValue() === 'undefined') && !this.ds.taskQueue.length;
  }
}
