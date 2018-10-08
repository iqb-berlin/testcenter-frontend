import { Component, OnInit, ViewChild } from '@angular/core';
import { BackendService, UnitResponse, ResultData, ReviewData, LogData } from './../backend.service';
import { MainDatastoreService } from './../maindatastore.service';
import { MatSnackBar, MatSort, MatTableDataSource } from '@angular/material';
import { SelectionModel } from '@angular/cdk/collections';
import { saveAs } from 'file-saver';


@Component({
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  displayedColumns: string[] = ['selectCheckbox', 'groupname', 'bookletsStarted', 'num_units_min', 'num_units_max', 'num_units_mean'];
  private resultDataSource = new MatTableDataSource<ResultData>([]);
  private isAdmin = false;
  // prepared for selection if needed sometime
  private tableselectionCheckbox = new SelectionModel<ResultData>(true, []);
  private dataLoading = false;

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private bs: BackendService,
    private mds: MainDatastoreService,
    public snackBar: MatSnackBar
  ) {
    this.mds.isAdmin$.subscribe(
      i => this.isAdmin = i);
  }

  ngOnInit() {
    this.mds.adminToken$.subscribe(at => this.updateTable());
    this.mds.workspaceId$.subscribe(ws => this.updateTable());
    // console.log(saveAs);
  }

  updateTable() {
    this.dataLoading = true;
    this.tableselectionCheckbox.clear();
    this.bs.getResultData(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue()).subscribe(
      (resultData: ResultData[]) => {
        this.dataLoading = false;
        this.resultDataSource = new MatTableDataSource<ResultData>(resultData);
        this.resultDataSource.sort = this.sort;
      }
    )
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
      this.dataLoading = true;
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupname);
      });
      this.bs.getResponses(
            this.mds.adminToken$.getValue(),
            this.mds.workspaceId$.getValue(),
            selectedGroups).subscribe(
      (responseData: UnitResponse[]) => {
        if (responseData.length > 0) {
          const columnDelimiter = ';';
          const lineDelimiter = '\n';
          let myCsvData = 'groupname' + columnDelimiter + 'loginname' + columnDelimiter + 'code' + columnDelimiter +
              'bookletname' + columnDelimiter + 'unitname' + columnDelimiter + 'responses' + lineDelimiter;
          responseData.forEach((resp: UnitResponse) => {
            if ((resp.responses !== null) && (resp.responses.length > 0)) {
             myCsvData += '"' + resp.groupname + '"' + columnDelimiter + '"' + resp.loginname + '"' + columnDelimiter + '"' + resp.code + '"' + columnDelimiter +
              '"' + resp.bookletname + '"' + columnDelimiter + '"' + resp.unitname + '"' + columnDelimiter + resp.responses.replace(/\\"/g, '""') + lineDelimiter;
            }
          });
          var blob = new Blob([myCsvData], {type: "text/csv;charset=utf-8"});
          saveAs(blob, "iqb-testcenter-responses.csv");
        } else {
          this.snackBar.open('Keine Daten verfügbar.', 'Fehler', {duration: 3000});
        }
        this.tableselectionCheckbox.clear();
        this.dataLoading = false;
    })
    }
  }

  // 444444444444444444444444444444444444444444444444444444444444444444444444444444444444444
  downloadReviewsCSV() {
    if (this.tableselectionCheckbox.selected.length > 0) {
      this.dataLoading = true;
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupname);
      });
      this.bs.getReviews(
            this.mds.adminToken$.getValue(),
            this.mds.workspaceId$.getValue(),
            selectedGroups).subscribe(
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
            })
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
              myCsvData += '"' + resp.groupname + '"' + columnDelimiter + '"' + resp.loginname + '"' + columnDelimiter + '"' + resp.code + '"' + columnDelimiter +
                '"' + resp.bookletname + '"' + columnDelimiter + '"' + resp.unitname + '"' + columnDelimiter  + '"' +  resp.priority  + '"' + columnDelimiter;
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
          var blob = new Blob([myCsvData], {type: "text/csv;charset=utf-8"});
          saveAs(blob, "iqb-testcenter-reviews.csv");
        } else {
          this.snackBar.open('Keine Daten verfügbar.', 'Fehler', {duration: 3000});
        }
        this.tableselectionCheckbox.clear();
        this.dataLoading = false;
      })
    }
  }

  // 444444444444444444444444444444444444444444444444444444444444444444444444444444444444444
  downloadLogsCSV() {
    if (this.tableselectionCheckbox.selected.length > 0) {
      this.dataLoading = true;
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupname);
      });
      this.bs.getLogs(
            this.mds.adminToken$.getValue(),
            this.mds.workspaceId$.getValue(),
            selectedGroups).subscribe(
      (responseData: LogData[]) => {
        if (responseData.length > 0) {
          const columnDelimiter = ';';
          const lineDelimiter = '\n';
          let myCsvData = 'groupname' + columnDelimiter + 'loginname' + columnDelimiter + 'code' + columnDelimiter +
              'bookletname' + columnDelimiter + 'unitname' + columnDelimiter +
              'logtime' + columnDelimiter + 'logentry' + lineDelimiter;
          responseData.forEach((resp: LogData) => {
            if ((resp.logentry !== null) && (resp.logentry.length > 0)) {
             myCsvData += '"' + resp.groupname + '"' + columnDelimiter + '"' + resp.loginname + '"' + columnDelimiter + '"' + resp.code + '"' + columnDelimiter +
              '"' + resp.bookletname + '"' + columnDelimiter + '"' + resp.unitname + '"' + columnDelimiter  + '"' +
              resp.logtime + '"' + columnDelimiter  + resp.logentry.replace(/\\"/g, '""')  + lineDelimiter;
            }
          });
          var blob = new Blob([myCsvData], {type: "text/csv;charset=utf-8"});
          saveAs(blob, "iqb-testcenter-logs.csv");
        } else {
          this.snackBar.open('Keine Daten verfügbar.', 'Fehler', {duration: 3000});
        }
        this.tableselectionCheckbox.clear();
        this.dataLoading = false;
      })
    }
  }
}
