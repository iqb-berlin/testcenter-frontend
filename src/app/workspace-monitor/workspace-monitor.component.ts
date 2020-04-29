import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {SelectionModel} from "@angular/cdk/collections";
import {BookletsStarted, MonitorData} from "./workspace-monitor.interfaces";
import {Subscription} from "rxjs";
import {MatSort} from "@angular/material/sort";
import {BackendService} from "./backend.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MainDataService} from "../maindata.service";
import {ActivatedRoute} from "@angular/router";
import {ServerError} from "iqb-components";

@Component({
  selector: 'app-workspace-monitor',
  templateUrl: './workspace-monitor.component.html',
  styleUrls: ['./workspace-monitor.component.css']
})
export class WorkspaceMonitorComponent implements OnInit, OnDestroy {
  private routingSubscription: Subscription = null;
  workspaceId = 0;
  workspaceName = '';

  displayedColumns: string[] = ['selectCheckbox', 'groupname', 'loginsPrepared',
    'personsPrepared', 'bookletsPrepared', 'bookletsStarted', 'bookletsLocked', 'laststart'];
  public monitorDataSource = new MatTableDataSource<MonitorData>([]);
  public tableselectionCheckbox = new SelectionModel<MonitorData>(true, []);
  public dataLoading = false;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  constructor(
    private route: ActivatedRoute,
    private bs: BackendService,
    public mds: MainDataService,
    public snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.routingSubscription = this.route.params.subscribe(params => {
      this.workspaceId = Number(params['ws']);
      this.workspaceName = 'xx'; // TODO where to get the workspace name from?
      this.updateTable();
    });
  }

  updateTable() {
    this.dataLoading = true;
    this.tableselectionCheckbox.clear();
    this.bs.getMonitorData(this.workspaceId).subscribe(
      (monitorData: MonitorData[]) => {
        this.dataLoading = false;
        this.monitorDataSource = new MatTableDataSource<MonitorData>(monitorData);
        this.monitorDataSource.sort = this.sort;
      }
    );
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
      this.bs.getBookletsStarted(this.workspaceId, selectedGroups).subscribe(bData => {

          const bookletList = bData as BookletsStarted[];
          if (bookletList.length > 0) {
            const columnDelimiter = ';';
            const lineDelimiter = '\n';

            let myCsvData = 'groupname' + columnDelimiter + 'loginname' + columnDelimiter + 'code' + columnDelimiter +
              'bookletname' + columnDelimiter + 'locked' + columnDelimiter + 'laststart' + lineDelimiter;
            bookletList.forEach((b: BookletsStarted) => {
              myCsvData += '"'
                + b.groupname + '"' + columnDelimiter + '"'
                + b.loginname + '"' + columnDelimiter + '"'
                + b.code + '"' + columnDelimiter + '"'
                + b.bookletname + '"' + columnDelimiter
                + '"' + (b.locked ? 'X' : '-') + '"' + columnDelimiter + '"'
                + b.laststart + '"' + lineDelimiter;
            });
            const blob = new Blob([myCsvData], {type: 'text/csv;charset=utf-8'});
            saveAs(blob, 'iqb-testcenter-bookletsStarted.csv');
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
      this.bs.lockBooklets(this.workspaceId, selectedGroups).subscribe(success => {
        if (success instanceof ServerError) {
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
      this.bs.unlockBooklets(this.workspaceId, selectedGroups).subscribe(success => {
        if (success instanceof ServerError) {
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
    if (this.routingSubscription !== null) {
      this.routingSubscription.unsubscribe();
    }
  }
}
