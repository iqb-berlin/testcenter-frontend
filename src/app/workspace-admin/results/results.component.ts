import { ConfirmDialogComponent, ConfirmDialogData } from 'iqb-components';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { saveAs } from 'file-saver';
import { BackendService } from '../backend.service';
import { WorkspaceDataService } from '../workspacedata.service';
import {
  LogData, ResultData, UnitResponse, ReviewData
} from '../workspace.interfaces';
import { MainDataService } from '../../maindata.service';

@Component({
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  displayedColumns: string[] = [
    'selectCheckbox', 'groupname', 'bookletsStarted', 'num_units_min', 'num_units_max', 'num_units_mean', 'lastchange'
  ];

  resultDataSource = new MatTableDataSource<ResultData>([]);
  // prepared for selection if needed sometime
  tableselectionCheckbox = new SelectionModel<ResultData>(true, []);

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private bs: BackendService,
    public wds: WorkspaceDataService,
    private deleteConfirmDialog: MatDialog,
    private mds: MainDataService,
    public snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.mds.setSpinnerOn();
      this.updateTable();
    });
  }

  updateTable(): void {
    this.tableselectionCheckbox.clear();
    if (this.wds.wsRole === 'MO') {
      this.resultDataSource = new MatTableDataSource<ResultData>([]);
      this.mds.setSpinnerOff();
    } else {
      this.bs.getResultData(this.wds.wsId).subscribe(
        (resultData: ResultData[]) => {
          this.resultDataSource = new MatTableDataSource<ResultData>(resultData);
          this.resultDataSource.sort = this.sort;
          this.mds.setSpinnerOff();
        }
      );
    }
  }

  isAllSelected(): boolean {
    const numSelected = this.tableselectionCheckbox.selected.length;
    const numRows = this.resultDataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected() ?
      this.tableselectionCheckbox.clear() :
      this.resultDataSource.data.forEach(row => this.tableselectionCheckbox.select(row));
  }

  downloadResponsesCSV(): void {
    if (this.tableselectionCheckbox.selected.length > 0) {
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupname);
      });
      this.mds.setSpinnerOn();
      this.bs.getResponses(this.wds.wsId, selectedGroups).subscribe(
      (responseData: UnitResponse[]) => {
        this.mds.setSpinnerOff();
        if (responseData.length > 0) {
          const bom = '\ufeff';
          const columnDelimiter = ';';
          const lineDelimiter = '\n';
          let myCsvData = 'groupname' + columnDelimiter
              + 'loginname' + columnDelimiter
              + 'code' + columnDelimiter
              + 'bookletname' + columnDelimiter
              + 'unitname' + columnDelimiter
              + 'responses' + columnDelimiter
              + 'restorePoint' + columnDelimiter
              + 'responseType' + columnDelimiter
              + 'response-ts' + columnDelimiter
              + 'restorePoint-ts' + columnDelimiter
              + 'laststate' + lineDelimiter;
          responseData.forEach((resp: UnitResponse) => {
            myCsvData += '"' + resp.groupname + '"' + columnDelimiter
                + '"' + resp.loginname + '"' + columnDelimiter
                + '"' + resp.code + '"' + columnDelimiter
                + '"' + resp.bookletname + '"' + columnDelimiter
                + '"' + resp.unitname + '"' + columnDelimiter;
            if ((resp.responses !== null) && (resp.responses.length > 0)) {
              myCsvData += resp.responses.replace(/\\"/g, '""') + columnDelimiter;
            } else {
              myCsvData += columnDelimiter;
            }
            if ((resp.restorepoint !== null) && (resp.restorepoint.length > 0)) {
              myCsvData += resp.restorepoint.replace(/\\"/g, '""') + columnDelimiter;
            } else {
              myCsvData += columnDelimiter;
            }
            if ((resp.responsetype !== null) && (resp.responsetype.length > 0)) {
              myCsvData += '"' + resp.responsetype + '"' + columnDelimiter;
            } else {
              myCsvData += columnDelimiter;
            }
            myCsvData += resp.responses_ts + columnDelimiter + resp.restorepoint_ts + columnDelimiter;
            if ((resp.laststate !== null) && (resp.laststate.length > 0)) {
              myCsvData += '"' + resp.laststate + '"' + lineDelimiter;
            } else {
              myCsvData += lineDelimiter;
            }
          });
          const blob = new Blob([bom + myCsvData], {type: 'text/csv;charset=utf-8'});
          saveAs(blob, 'iqb-testcenter-responses.csv');
        } else {
          this.snackBar.open('Keine Daten verfügbar.', 'Fehler', {duration: 3000});
        }
        this.tableselectionCheckbox.clear();
      });
    }
  }

  downloadReviewsCSV(): void {
    if (this.tableselectionCheckbox.selected.length > 0) {
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupname);
      });
      this.mds.setSpinnerOn();
      this.bs.getReviews(this.wds.wsId, selectedGroups).subscribe(
      (responseData: ReviewData[]) => {
        this.mds.setSpinnerOff();
        if (responseData.length > 0) {
          // collect categories
          const allCategories: string[] = [];
          responseData.forEach((resp: ReviewData) => {
            resp.categories.split(' ').forEach(s => {
              const s_trimmed = s.trim();
              if (s_trimmed.length > 0) {
                if (!allCategories.includes(s_trimmed)) {
                  allCategories.push(s_trimmed);
                }
              }
            });
          });

          const bom = '\ufeff';
          const columnDelimiter = ';';
          const lineDelimiter = '\n';
          let myCsvData = 'groupname' + columnDelimiter + 'loginname' + columnDelimiter + 'code' + columnDelimiter +
              'bookletname' + columnDelimiter + 'unitname' + columnDelimiter +
              'priority' + columnDelimiter;
          allCategories.forEach(s => {
            myCsvData += 'category: ' + s + columnDelimiter;
          });
          myCsvData += 'reviewtime' + columnDelimiter + 'entry' + lineDelimiter;

          responseData.forEach((resp: ReviewData) => {
            if ((resp.entry !== null) && (resp.entry.length > 0)) {
              myCsvData += '"' + resp.groupname + '"' + columnDelimiter + '"' + resp.loginname + '"' +
                columnDelimiter + '"' + resp.code + '"' + columnDelimiter + '"' + resp.bookletname + '"' +
                columnDelimiter + '"' + resp.unitname + '"' + columnDelimiter  + '"' +
                resp.priority  + '"' + columnDelimiter;
              const resp_categories = resp.categories.split(' ');
              allCategories.forEach(s => {
                if (resp_categories.includes(s)) {
                  myCsvData += '"X"' + columnDelimiter;
                } else {
                  myCsvData += columnDelimiter;
                }
              });
              myCsvData += '"' + resp.reviewtime + '"' + columnDelimiter  + '"' +  resp.entry  + '"' + lineDelimiter;
            }
          });
          const blob = new Blob([bom + myCsvData], {type: 'text/csv;charset=utf-8'});
          saveAs(blob, 'iqb-testcenter-reviews.csv');
        } else {
          this.snackBar.open('Keine Daten verfügbar.', 'Fehler', {duration: 3000});
        }
        this.tableselectionCheckbox.clear();
      });
    }
  }

  downloadLogsCSV(): void {
    if (this.tableselectionCheckbox.selected.length > 0) {
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupname);
      });
      this.mds.setSpinnerOn();
      this.bs.getLogs(this.wds.wsId, selectedGroups).subscribe(
      (responseData: LogData[]) => {
        this.mds.setSpinnerOff();
        if (responseData.length > 0) {
          const bom = '\ufeff';
          const columnDelimiter = ';';
          const lineDelimiter = '\n';
          let myCsvData = 'groupname' + columnDelimiter + 'loginname' + columnDelimiter + 'code' + columnDelimiter +
              'bookletname' + columnDelimiter + 'unitname' + columnDelimiter +
              'timestamp' + columnDelimiter + 'logentry' + lineDelimiter;
          responseData.forEach((resp: LogData) => {
            if ((resp.logentry !== null) && (resp.logentry.length > 0)) {
             myCsvData += '"' + resp.groupname + '"' + columnDelimiter + '"' + resp.loginname + '"' + columnDelimiter + '"' + resp.code + '"' + columnDelimiter +
              '"' + resp.bookletname + '"' + columnDelimiter + '"' + resp.unitname + '"' + columnDelimiter  + '"' +
              resp.timestamp.toString() + '"' + columnDelimiter  + resp.logentry.replace(/\\"/g, '""')  + lineDelimiter;
            }
          });
          const blob = new Blob([bom + myCsvData], {type: 'text/csv;charset=utf-8'});
          saveAs(blob, 'iqb-testcenter-logs.csv');
        } else {
          this.snackBar.open('Keine Daten verfügbar.', 'Fehler', {duration: 3000});
        }
        this.tableselectionCheckbox.clear();
      });
    }
  }

  deleteData(): void {
    if (this.tableselectionCheckbox.selected.length > 0) {
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupname);
      });

      let prompt = 'Es werden alle Antwort- und Logdaten in der Datenbank für diese ';
      if (selectedGroups.length > 1) {
        prompt = prompt + selectedGroups.length + ' Gruppen ';
      } else {
        prompt = prompt + ' Gruppe "' + selectedGroups[0] + '" ';
      }

      const dialogRef = this.deleteConfirmDialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogData>{
          title: 'Löschen von Gruppendaten',
          content: `${prompt}gelöscht. Fortsetzen?`,
          confirmbuttonlabel: 'Gruppendaten löschen',
          showcancel: true
        }
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result !== false) {
          this.mds.setSpinnerOn();
          this.bs.deleteData(this.wds.wsId, selectedGroups).subscribe((ok: boolean) => {
            if (ok) {
              this.snackBar.open('Löschen erfolgreich.', 'Ok.', { duration: 3000 });
            } else {
              this.snackBar.open('Löschen nicht erfolgreich.', 'Fehler', { duration: 3000 });
            }
            this.tableselectionCheckbox.clear();
            this.updateTable();
          });
        }
      });
    }
  }
}
