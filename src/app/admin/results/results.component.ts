import { Component, OnInit, ViewChild } from '@angular/core';
import { BackendService, GroupResponse } from './../backend.service';
import { MainDatastoreService } from './../maindatastore.service';
import { MatSnackBar, MatSort, MatTableDataSource } from '@angular/material';
import { SelectionModel } from '@angular/cdk/collections';
// import { saveAs } from 'file-saver';


@Component({
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  displayedColumns: string[] = ['selectCheckbox', 'name', 'testsTotal', 'testsStarted', 'responsesGiven'];
  private groupStats = new MatTableDataSource<GroupResponse>([]);
  private isAdmin = false;
  private downloadButton = Object;
  private tableselectionCheckbox = new SelectionModel <GroupResponse>(true, []);

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
    // console.log(saveAs);
  }

  updateStats() {
    this.bs.showStats(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue(), true).subscribe(
      (responseData: GroupResponse[]) => {
        this.groupStats = new MatTableDataSource<GroupResponse>(responseData);
        this.groupStats.sort = this.sort;
      }
    )
  }

  isAllSelected() {
    const numSelected = this.tableselectionCheckbox.selected.length;
    const numRows = this.groupStats.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
        this.tableselectionCheckbox.clear() :
        this.groupStats.data.forEach(row => this.tableselectionCheckbox.select(row));
  }

  downloadOnClick() {
    // let observableDlResponse = this.bs.downloadCSVResponses(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue(), this.tableselectionCheckbox.selected);


    // observableDlResponse.subscribe(
    //   (responseData: string) => {
    //     let savedFileContent = responseData;

    //     // this.groupStats = new MatTableDataSource<GroupResponse>(responseData);
    //     // this.groupStats.sort = this.sort;

    //     //
    //     const saveFile = new File([savedFileContent], 'responses.csv', { type: 'text/plain;charset=utf-8' });
    //     saveAs(saveFile);
    //   }
    // )

    // create an array with groupIds that you get with tableselectionCheckbox
    let processedSelection = [];
    this.tableselectionCheckbox.selected.forEach(element => {
      processedSelection.push(element.name);
    });

    this.bs.downloadCSVResponses2(this.mds.adminToken$.getValue(), this.mds.workspaceId$.getValue(), processedSelection);

  }

}
