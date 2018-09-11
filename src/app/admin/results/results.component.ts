import { Component, OnInit, ViewChild } from '@angular/core';
import { BackendService, GroupResponse } from './../backend/backend.service';
import { MainDatastoreService } from './../maindatastore.service';
import { MatSnackBar, MatSort, MatTableDataSource } from '@angular/material';

@Component({
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  displayedColumns: string[] = ['check', 'name', 'testsTotal', 'testsStarted', 'responsesGiven'];
  private groupStats = new MatTableDataSource<GroupResponse>([]);
  private isAdmin = false;
  private downloadButton = Object;

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
    this.mds.adminToken$.subscribe(at => this.updateStats());
    this.mds.workspaceId$.subscribe(ws => this.updateStats());
  }

  updateStats() {
    this.bs.showStats(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue(), true).subscribe(
      (responseData: GroupResponse[]) => {
        this.groupStats = new MatTableDataSource<GroupResponse>(responseData);
        this.groupStats.sort = this.sort;
      }
    ) 
  }


}
