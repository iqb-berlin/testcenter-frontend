import {ConfirmDialogComponent, ConfirmDialogData, ServerError} from 'iqb-components';
import { Component, OnInit, ViewChild } from '@angular/core';
import { BackendService } from '../backend.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { saveAs } from 'file-saver';
import { SysCheckStatistics } from '../workspace.interfaces';
import { WorkspaceDataService } from '../workspacedata.service';


@Component({
  templateUrl: './syscheck.component.html',
  styleUrls: ['./syscheck.component.css']
})
export class SyscheckComponent implements OnInit {
  displayedColumns: string[] = ['selectCheckbox', 'syscheckLabel', 'number', 'details-os', 'details-browser'];
  public resultDataSource = new MatTableDataSource<SysCheckStatistics>([]);
  // prepared for selection if needed sometime
  public tableselectionCheckbox = new SelectionModel<SysCheckStatistics>(true, []);
  public dataLoading = false;

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private bs: BackendService,
    private deleteConfirmDialog: MatDialog,
    public wds: WorkspaceDataService,
    public snackBar: MatSnackBar
  ) {
  }

  ngOnInit() {
    this.updateTable();
  }

  updateTable() {
    this.dataLoading = true;
    this.tableselectionCheckbox.clear();
    this.bs.getSysCheckReportList(this.wds.ws).subscribe(
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


  downloadReportsCSV() {

    if (this.tableselectionCheckbox.selected.length > 0) {
      this.dataLoading = true;
      const selectedReports: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedReports.push(element.id);
      });
      // TODO determine OS dependent line ending char and use this
      this.bs.getSysCheckReport(this.wds.ws, selectedReports, ';', '"', '\n').subscribe(
      (reportData: Blob) => {
        if (reportData.size > 0) {
          saveAs(reportData, 'iqb-testcenter-syscheckreports.csv');
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

          this.dataLoading = true;
          this.bs.deleteSysCheckReports(this.wds.ws, selectedReports).subscribe((fileDeletionReport) => {

            if (fileDeletionReport instanceof ServerError) {
              this.wds.setNewErrorMsg(fileDeletionReport as ServerError);
            } else {

              const message = [];
              if (fileDeletionReport.deleted.length > 0) {
                message.push(fileDeletionReport.deleted.length + ' Dateien erfolgreich gelöscht.');
              }
              if (fileDeletionReport.not_allowed.length > 0) {
                message.push(fileDeletionReport.not_allowed.length + ' Dateien konnten nicht gelöscht werden.');
              }

              this.snackBar.open(message.join('<br>'), message.length > 1 ? 'Achtung' : '', {duration: 1000});

              this.updateTable();
              this.wds.setNewErrorMsg();
            }
          });
        }
      });
    }
  }
}
