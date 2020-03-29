import { LogData } from '../workspace.interfaces';
import { WorkspaceDataService } from '../workspacedata.service';
import {ConfirmDialogComponent, ConfirmDialogData, ServerError} from 'iqb-components';
import { Component, OnInit, ViewChild } from '@angular/core';
import { BackendService } from '../backend.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { saveAs } from 'file-saver';
import { ResultData, UnitResponse, ReviewData } from '../workspace.interfaces';
import {MainDataService} from "../../maindata.service";


@Component({
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  displayedColumns: string[] = ['selectCheckbox', 'groupname', 'bookletsStarted', 'num_units_min', 'num_units_max', 'num_units_mean', 'lastchange'];
  public resultDataSource = new MatTableDataSource<ResultData>([]);
  // prepared for selection if needed sometime
  public tableselectionCheckbox = new SelectionModel<ResultData>(true, []);

  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private bs: BackendService,
    public wds: WorkspaceDataService,
    private deleteConfirmDialog: MatDialog,
    private mds: MainDataService,
    public snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.updateTable();
    })
  }

  updateTable() {
    this.tableselectionCheckbox.clear();
    if (this.wds.wsRole === 'MO') {
      this.resultDataSource = new MatTableDataSource<ResultData>([]);
    } else {
      this.mds.incrementDelayedProcessesCount();
      this.bs.getResultData().subscribe(
        (resultData: ResultData[]) => {
          this.mds.decrementDelayedProcessesCount();
          this.resultDataSource = new MatTableDataSource<ResultData>(resultData);
          this.resultDataSource.sort = this.sort;
        }, (err: ServerError) => {
          this.mds.appError$.next({
            label: err.labelNice,
            description: err.labelSystem,
            category: "PROBLEM"
          });
          this.mds.decrementDelayedProcessesCount();
        }
      );
    }
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
  downloadResponsesCSV() {
    if (this.tableselectionCheckbox.selected.length > 0) {
      this.mds.incrementDelayedProcessesCount();
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupname);
      });
      this.bs.getResponses(selectedGroups).subscribe(
      (responseData: UnitResponse[]) => {
        if (responseData.length > 0) {
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
          const blob = new Blob([myCsvData], {type: 'text/csv;charset=utf-8'});
          saveAs(blob, 'iqb-testcenter-responses.csv');
        } else {
          this.snackBar.open('Keine Daten verfügbar.', 'Fehler', {duration: 3000});
        }
        this.tableselectionCheckbox.clear();
        this.mds.decrementDelayedProcessesCount();
      }, (err: ServerError) => {
          this.mds.appError$.next({
            label: err.labelNice,
            description: err.labelSystem,
            category: "PROBLEM"
          });
          this.mds.decrementDelayedProcessesCount();
      });
    }
  }

  // 444444444444444444444444444444444444444444444444444444444444444444444444444444444444444
  downloadReviewsCSV() {
    if (this.tableselectionCheckbox.selected.length > 0) {
      this.mds.incrementDelayedProcessesCount();
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupname);
      });
      this.bs.getReviews(selectedGroups).subscribe(
      (responseData: ReviewData[]) => {
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
          const blob = new Blob([myCsvData], {type: 'text/csv;charset=utf-8'});
          saveAs(blob, 'iqb-testcenter-reviews.csv');
        } else {
          this.snackBar.open('Keine Daten verfügbar.', 'Fehler', {duration: 3000});
        }
        this.tableselectionCheckbox.clear();
        this.mds.decrementDelayedProcessesCount();
      }, (err: ServerError) => {
          this.mds.appError$.next({
            label: err.labelNice,
            description: err.labelSystem,
            category: "PROBLEM"
          });
          this.mds.decrementDelayedProcessesCount();
      });
    }
  }

  // 444444444444444444444444444444444444444444444444444444444444444444444444444444444444444
  downloadLogsCSV() {
    if (this.tableselectionCheckbox.selected.length > 0) {
      this.mds.incrementDelayedProcessesCount();
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupname);
      });
      this.bs.getLogs(selectedGroups).subscribe(
      (responseData: LogData[]) => {
        if (responseData.length > 0) {
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
          const blob = new Blob([myCsvData], {type: 'text/csv;charset=utf-8'});
          saveAs(blob, 'iqb-testcenter-logs.csv');
        } else {
          this.snackBar.open('Keine Daten verfügbar.', 'Fehler', {duration: 3000});
        }
        this.tableselectionCheckbox.clear();
        this.mds.decrementDelayedProcessesCount();
      }, (err: ServerError) => {
          this.mds.appError$.next({
            label: err.labelNice,
            description: err.labelSystem,
            category: "PROBLEM"
          });
          this.mds.decrementDelayedProcessesCount();
      });
    }
  }

  deleteData() {
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
          content: prompt + 'gelöscht. Fortsetzen?',
          confirmbuttonlabel: 'Gruppendaten löschen',
          showcancel: true
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result !== false) {
          // =========================================================
          this.mds.incrementDelayedProcessesCount();
          this.bs.deleteData(selectedGroups).subscribe(() => {
              this.tableselectionCheckbox.clear();
              this.mds.decrementDelayedProcessesCount();
              // TODO refresh list!
          }, (err: ServerError) => {
            this.mds.appError$.next({
              label: err.labelNice,
              description: err.labelSystem,
              category: "PROBLEM"
            });
            this.mds.decrementDelayedProcessesCount();
          });
        }
      });
    }
  }
}
