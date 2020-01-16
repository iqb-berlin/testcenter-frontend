import { BookletsStarted } from './../workspace.interfaces';
import { WorkspaceDataService } from './../workspacedata.service';
import { BackendService } from './../backend.service';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { saveAs } from 'file-saver';
import { MonitorData } from '../workspace.interfaces';
import { Subscription } from 'rxjs';
import { ServerError } from 'src/app/backend.service';


@Component({
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.css']
})
export class MonitorComponent implements OnInit, OnDestroy {

  displayedColumns: string[] = ['selectCheckbox', 'groupname', 'loginsPrepared',
          'personsPrepared', 'bookletsPrepared', 'bookletsStarted', 'bookletsLocked', 'laststart'];
  public monitorDataSource = new MatTableDataSource<MonitorData>([]);
  public tableselectionCheckbox = new SelectionModel<MonitorData>(true, []);
  private workspaceIdSubscription: Subscription = null;
  public dataLoading = false;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private bs: BackendService,
    public wds: WorkspaceDataService,
    public snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.workspaceIdSubscription = this.wds.workspaceId$.subscribe(ws => {
      this.updateTable();
    });
  }

  updateTable() {
    this.dataLoading = true;
    this.tableselectionCheckbox.clear();
    this.bs.getMonitorData().subscribe(
      (monitorData: MonitorData[]) => {
        this.dataLoading = false;
        this.monitorDataSource = new MatTableDataSource<MonitorData>(monitorData);
        this.monitorDataSource.sort = this.sort;
      }
    )

  }

  isAllSelected() {
    const numSelected = this.tableselectionCheckbox.selected.length;
    const numRows = this.monitorDataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
        this.tableselectionCheckbox.clear() :
        this.monitorDataSource.data.forEach(row => this.tableselectionCheckbox.select(row));
  }

  downloadCSV() {
    if (this.tableselectionCheckbox.selected.length > 0) {
      this.dataLoading = true;
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupname);
      });
      this.bs.getBookletsStarted(selectedGroups).subscribe(bData => {

          const bookletList = bData as BookletsStarted[];
          if (bookletList.length > 0) {
            const columnDelimiter = ';';
            const lineDelimiter = '\n';

            let myCsvData = 'groupname' + columnDelimiter + 'loginname' + columnDelimiter + 'code' + columnDelimiter +
                'bookletname' + columnDelimiter + 'locked' + columnDelimiter + 'laststart' + lineDelimiter;
            bookletList.forEach((b: BookletsStarted) => {
               myCsvData += '"' + b.groupname + '"' + columnDelimiter + '"' + b.loginname + '"' + columnDelimiter + '"' + b.code + '"' + columnDelimiter +
                '"' + b.bookletname + '"' + columnDelimiter + '"' + (b.locked ? 'X' : '-') + '"' + columnDelimiter + '"' + b.laststart + '"' + lineDelimiter;
            });
            var blob = new Blob([myCsvData], {type: "text/csv;charset=utf-8"});
            saveAs(blob, "iqb-testcenter-bookletsStarted.csv");
          } else {
            this.snackBar.open('Keine Daten verfügbar.', 'Fehler', {duration: 3000});
          }

          this.tableselectionCheckbox.clear();
          this.dataLoading = false;
        }
      );
    }
  }

  lock() {
    if (this.tableselectionCheckbox.selected.length > 0) {
      this.dataLoading = true;
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupname);
      });
      this.bs.lockBooklets(selectedGroups).subscribe(success => {
        if (success instanceof ServerError) {
          this.wds.setNewErrorMsg(success as ServerError);
          this.snackBar.open('Testhefte konnten nicht gesperrt werden.', 'Systemfehler', {duration: 3000});
        } else {
          const ok = success as boolean;
          if (ok) {
            this.snackBar.open('Testhefte wurden gesperrt.', 'Sperrung', {duration: 1000});
          } else {
            this.snackBar.open('Testhefte konnten nicht gesperrt werden.', 'Fehler', {duration: 3000});
          }
        }
        this.dataLoading = false;
        this.updateTable();
      });
    }
  }

  unlock() {
    if (this.tableselectionCheckbox.selected.length > 0) {
      this.dataLoading = true;
      const selectedGroups: string[] = [];
      this.tableselectionCheckbox.selected.forEach(element => {
        selectedGroups.push(element.groupname);
      });
      this.bs.unlockBooklets(selectedGroups).subscribe(success => {
        if (success instanceof ServerError) {
          this.wds.setNewErrorMsg(success as ServerError);
          this.snackBar.open('Testhefte konnten nicht freigegeben werden.', 'Systemfehler', {duration: 3000});
        } else {
          const ok = success as boolean;
          if (ok) {
            this.snackBar.open('Testhefte wurden freigegeben.', 'Sperrung', {duration: 1000});
          } else {
            this.snackBar.open('Testhefte konnten nicht freigegeben werden.', 'Fehler', {duration: 3000});
          }
        }
        this.dataLoading = false;
        this.updateTable();
      });
    }
  }

  // % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
  ngOnDestroy() {
    if (this.workspaceIdSubscription !== null) {
      this.workspaceIdSubscription.unsubscribe();
    }
  }
}
