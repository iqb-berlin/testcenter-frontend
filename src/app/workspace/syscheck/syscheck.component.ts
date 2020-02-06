import { ConfirmDialogComponent, ConfirmDialogData } from 'iqb-components';
import { Component, OnInit, ViewChild } from '@angular/core';
import { BackendService } from '../backend.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { saveAs } from 'file-saver';
import { SysCheckStatistics } from '../workspace.interfaces';


@Component({
  templateUrl: './syscheck.component.html',
  styleUrls: ['./syscheck.component.css']
})
export class SyscheckComponent implements OnInit {
  displayedColumns: string[] = ['selectCheckbox', 'syscheckLabel', 'number', 'details'];
  public resultDataSource = new MatTableDataSource<SysCheckStatistics>([]);
  // prepared for selection if needed sometime
  public tableselectionCheckbox = new SelectionModel<SysCheckStatistics>(true, []);
  public dataLoading = false;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private bs: BackendService,
    private deleteConfirmDialog: MatDialog,
    public snackBar: MatSnackBar
  ) {
  }

  ngOnInit() {
    this.updateTable();
  }

  updateTable() {
    this.dataLoading = true;
    this.tableselectionCheckbox.clear();
    this.bs.getSysCheckReportList().subscribe(
      (resultData: SysCheckStatistics[]) => {
        this.dataLoading = false;
        this.resultDataSource = new MatTableDataSource<SysCheckStatistics>(resultData);
        this.resultDataSource.sort = this.sort;
      }
    );
  }

  isAllSelected() {
    const numSelected = this.tableselectionCheckbox.selected.length;
    const numRows = this.resultDataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
        this.tableselectionCheckbox.clear() :
        this.resultDataSource.data.forEach(row => this.tableselectionCheckbox.select(row));
  }

  // 444444444444444444444444444444444444444444444444444444444444444444444444444444444444444
  downloadReportsCSV() {
    if (this.tableselectionCheckbox.selected.length > 0) {
      this.dataLoading = true;
      const selectedReports: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedReports.push(element.id);
      });
      this.bs.getSysCheckReport(selectedReports, ';', '"').subscribe(
      (reportData: string[]) => {
        if (reportData.length > 0) {
          const lineDelimiter = '\n';
          let myCsvData = '';
          reportData.forEach((repLine: string) => {
            myCsvData += repLine + lineDelimiter;
          });
          const blob = new Blob([myCsvData], {type: 'text/csv;charset=utf-8'});
          saveAs(blob, 'iqb-testcenter-syscheckreports.csv');
        } else {
          this.snackBar.open('Keine Daten verfügbar.', 'Fehler', {duration: 3000});
        }
        this.tableselectionCheckbox.clear();
        this.dataLoading = false;
    });
    }
  }

  deleteReports() {
    if (this.tableselectionCheckbox.selected.length > 0) {
      const selectedReports: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedReports.push(element.id);
      });

      let prompt = 'Es werden alle Berichte für diese';
      if (selectedReports.length > 1) {
        prompt = prompt + ' ' + selectedReports.length + ' System-Checks ';
      } else {
        prompt = prompt + 'n System-Check "' + selectedReports[0] + '" ';
      }

      const dialogRef = this.deleteConfirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogData>{
          title: 'Löschen von Berichten',
          content: prompt + 'gelöscht. Fortsetzen?',
          confirmbuttonlabel: 'Berichtsdaten löschen',
          showcancel: true
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result !== false) {
          // =========================================================
          this.dataLoading = true;
          this.bs.deleteSysCheckReports(selectedReports).subscribe(() => {
                  this.tableselectionCheckbox.clear();
                  this.dataLoading = false;
                });
          }
        });
    }
  }
}
